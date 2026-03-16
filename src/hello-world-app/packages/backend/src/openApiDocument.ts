const backendRoutePrefix = '/erp';
const sessionTokenSecuritySchemeName = 'SessionTokenHeader';
const headerParameterLocation = 'header';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

export type RewriteOpenApiResponseInput = {
  endpoint: string;
  method: string;
  contentType: string | null;
  body: string;
};

export type RewriteOpenApiResponseResult = {
  contentType: string | null;
  body: string;
};

export function rewriteOpenApiResponse(input: RewriteOpenApiResponseInput): RewriteOpenApiResponseResult | null {
  if (!shouldRewriteOpenApiResponse(input.endpoint, input.method, input.contentType)) {
    return null;
  }

  const document = parseJsonObject(input.body);

  if (!document) {
    return null;
  }

  const rewrittenDocument = rewriteOpenApiDocument(document);

  return {
    contentType: input.contentType,
    body: JSON.stringify(rewrittenDocument),
  };
}

function shouldRewriteOpenApiResponse(endpoint: string, method: string, contentType: string | null): boolean {
  return method === 'GET' && endpoint.toLowerCase().endsWith('.json') && isJsonContentType(contentType);
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return /(^|\s|;)(application\/json|application\/.+\+json)(;|$)/i.test(contentType);
}

function parseJsonObject(body: string): JsonObject | null {
  try {
    const parsed = JSON.parse(body) as JsonValue;

    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function rewriteOpenApiDocument(document: JsonObject): JsonObject {
  const headerParameterComponentNames = getHeaderParameterComponentNames(document);
  const rewrittenDocument = rewriteJsonValue(document, headerParameterComponentNames);

  if (!isJsonObject(rewrittenDocument)) {
    return document;
  }

  if (!isOpenApiRootDocument(document)) {
    return rewrittenDocument;
  }

  rewrittenDocument.servers = [{ url: '/' }];
  rewrittenDocument.security = [{ [sessionTokenSecuritySchemeName]: [] }];

  const existingComponents = rewrittenDocument.components;
  const components: JsonObject = isJsonObject(existingComponents) ? existingComponents : {};
  components.securitySchemes = {
    [sessionTokenSecuritySchemeName]: {
      type: 'apiKey',
      in: headerParameterLocation,
      name: 'X-Session-Token',
    },
  };
  rewrittenDocument.components = components;

  const existingPaths = rewrittenDocument.paths;

  if (isJsonObject(existingPaths)) {
    rewrittenDocument.paths = rewritePathMap(existingPaths);
  }

  return rewrittenDocument;
}

function isOpenApiRootDocument(document: JsonObject): boolean {
  return typeof document.openapi === 'string' || typeof document.swagger === 'string';
}

function getHeaderParameterComponentNames(document: JsonObject): Set<string> {
  const names = new Set<string>();
  const components = document.components;

  const parameters = isJsonObject(components) ? components.parameters : undefined;

  if (!isJsonObject(components) || !isJsonObject(parameters)) {
    return names;
  }

  for (const [name, parameter] of Object.entries(parameters)) {
    if (isHeaderParameter(parameter)) {
      names.add(name);
    }
  }

  return names;
}

function rewriteJsonValue(value: JsonValue, headerParameterComponentNames: Set<string>): JsonValue {
  if (Array.isArray(value)) {
    return rewriteArray(value, headerParameterComponentNames);
  }

  if (!isJsonObject(value)) {
    return rewriteScalar(value);
  }

  const rewrittenEntries: Array<[string, JsonValue]> = [];

  for (const [key, currentValue] of Object.entries(value)) {
    if (key === 'parameters' && Array.isArray(currentValue)) {
      rewrittenEntries.push([key, rewriteParameterArray(currentValue, headerParameterComponentNames)]);
      continue;
    }

    if (key === 'components' && isJsonObject(currentValue)) {
      rewrittenEntries.push([key, rewriteComponents(currentValue, headerParameterComponentNames)]);
      continue;
    }

    if (key === 'security') {
      continue;
    }

    rewrittenEntries.push([key, rewriteJsonValue(currentValue, headerParameterComponentNames)]);
  }

  return Object.fromEntries(rewrittenEntries);
}

function rewriteArray(values: JsonValue[], headerParameterComponentNames: Set<string>): JsonValue[] {
  return values.map(value => rewriteJsonValue(value, headerParameterComponentNames));
}

function rewriteScalar(value: JsonValue): JsonValue {
  if (typeof value !== 'string') {
    return value;
  }

  return rewriteReference(value);
}

function rewriteComponents(components: JsonObject, headerParameterComponentNames: Set<string>): JsonObject {
  const rewrittenEntries: Array<[string, JsonValue]> = [];

  for (const [key, value] of Object.entries(components)) {
    if (key === 'parameters' && isJsonObject(value)) {
      rewrittenEntries.push([key, rewriteParameterComponents(value, headerParameterComponentNames)]);
      continue;
    }

    if (key === 'securitySchemes') {
      continue;
    }

    rewrittenEntries.push([key, rewriteJsonValue(value, headerParameterComponentNames)]);
  }

  return Object.fromEntries(rewrittenEntries);
}

function rewriteParameterComponents(parameters: JsonObject, headerParameterComponentNames: Set<string>): JsonObject {
  const rewrittenEntries: Array<[string, JsonValue]> = [];

  for (const [name, parameter] of Object.entries(parameters)) {
    if (headerParameterComponentNames.has(name)) {
      continue;
    }

    rewrittenEntries.push([name, rewriteJsonValue(parameter, headerParameterComponentNames)]);
  }

  return Object.fromEntries(rewrittenEntries);
}

function rewriteParameterArray(values: JsonValue[], headerParameterComponentNames: Set<string>): JsonValue[] {
  return values
    .filter(value => !isHeaderParameterReference(value, headerParameterComponentNames) && !isHeaderParameter(value))
    .map(value => rewriteJsonValue(value, headerParameterComponentNames));
}

function rewritePathMap(paths: JsonObject): JsonObject {
  const rewrittenEntries: Array<[string, JsonValue]> = [];

  for (const [path, value] of Object.entries(paths)) {
    rewrittenEntries.push([prefixBackendRoute(path), value]);
  }

  return Object.fromEntries(rewrittenEntries);
}

function prefixBackendRoute(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${backendRoutePrefix}${normalizedPath}`;
}

function rewriteReference(reference: string): string {
  if (reference.startsWith('#') || /^[a-z]+:\/\//i.test(reference)) {
    return reference;
  }

  const [path = '', fragment] = reference.split('#', 2);

  if (!path.startsWith('/')) {
    return reference;
  }

  const rewrittenPath = `${backendRoutePrefix}${path}`;

  return fragment ? `${rewrittenPath}#${fragment}` : rewrittenPath;
}

function isHeaderParameterReference(value: JsonValue, headerParameterComponentNames: Set<string>): boolean {
  if (!isJsonObject(value) || typeof value.$ref !== 'string') {
    return false;
  }

  const refPrefix = '#/components/parameters/';

  if (!value.$ref.startsWith(refPrefix)) {
    return false;
  }

  return headerParameterComponentNames.has(value.$ref.slice(refPrefix.length));
}

function isHeaderParameter(value: JsonValue): boolean {
  return isJsonObject(value) && value.in === headerParameterLocation;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
