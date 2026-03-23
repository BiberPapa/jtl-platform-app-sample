import {
  HIDDEN_OPERATION_TAGS,
  OPERATION_OVERRIDES,
  PATH_TAG_OVERRIDES,
  REMOVED_HEADER_NAMES,
  REMOVED_OPERATION_TAGS,
  SESSION_TOKEN_HEADER_DESCRIPTION,
  SESSION_TOKEN_HEADER_NAME,
  TAG_DESCRIPTIONS,
  TAG_RENAMES,
} from './openApiTransformRules.js';

type OpenApiTag = {
  name?: string;
  description?: string;
  [key: string]: unknown;
};

type OpenApiResponse = {
  description?: string;
  [key: string]: unknown;
};

type OpenApiParameter = {
  description?: string;
  in?: string;
  name?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
  [key: string]: unknown;
};

type OpenApiOperation = {
  parameters?: OpenApiParameter[];
  tags?: string[];
  summary?: string;
  description?: string;
  responses?: Record<string, OpenApiResponse>;
  [key: string]: unknown;
};

type OpenApiPathItem = Record<string, unknown>;

type OpenApiDocument = {
  info?: Record<string, unknown>;
  paths?: Record<string, OpenApiPathItem>;
  tags?: OpenApiTag[];
  [key: string]: unknown;
};

const DESCRIPTION_PLACEHOLDERS = new Set(['Development', 'Planned']);
const STRIPPABLE_DESCRIPTION_PREFIX = /<p[^>]*><\/p>/i;
const OPERATION_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

export function transformOpenApiDocument(documentText: string): string {
  const document = JSON.parse(stripByteOrderMark(documentText)) as OpenApiDocument;
  const transformedPaths = transformPaths(document.paths ?? {});

  document.paths = transformedPaths;
  document.tags = buildTransformedTags(document.tags ?? [], transformedPaths);

  return JSON.stringify(document);
}

function transformPaths(paths: Record<string, OpenApiPathItem>): Record<string, OpenApiPathItem> {
  const transformedPaths: Record<string, OpenApiPathItem> = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    const transformedPathItem: OpenApiPathItem = {};

    for (const [method, operationValue] of Object.entries(pathItem)) {
      if (!OPERATION_METHODS.has(method) || !isRecord(operationValue)) {
        transformedPathItem[method] = operationValue;
        continue;
      }

      const operation = transformOperation(path, method.toUpperCase(), operationValue as OpenApiOperation);
      if (operation !== null) {
        transformedPathItem[method] = operation;
      }
    }

    if (Object.keys(transformedPathItem).length > 0) {
      transformedPaths[path] = transformedPathItem;
    }
  }

  return transformedPaths;
}

function transformOperation(path: string, method: string, operation: OpenApiOperation): OpenApiOperation | null {
  if ((operation.tags ?? []).some(tag => HIDDEN_OPERATION_TAGS.has(tag))) {
    return null;
  }

  const transformedOperation: OpenApiOperation = {
    ...operation,
  };

  const transformedTags = transformOperationTags(path, operation.tags ?? []);
  if (transformedTags.length > 0) {
    transformedOperation.tags = transformedTags;
  } else {
    delete transformedOperation.tags;
  }

  const transformedParameters = transformParameters(transformedOperation.parameters);
  if (transformedParameters.length > 0) {
    transformedOperation.parameters = transformedParameters;
  } else {
    delete transformedOperation.parameters;
  }

  const override = OPERATION_OVERRIDES.get(`${method} ${path}`);
  const normalizedSummary = normalizeSummary(override?.summary ?? transformedOperation.summary);
  const normalizedDescription = normalizeDescription(override?.description ?? transformedOperation.description);
  const normalizedResponses = transformResponses(path, override?.responses, transformedOperation.responses);

  if (normalizedSummary) {
    transformedOperation.summary = normalizedSummary;
  } else {
    delete transformedOperation.summary;
  }

  if (normalizedDescription) {
    transformedOperation.description = normalizedDescription;
  } else {
    delete transformedOperation.description;
  }

  if (normalizedResponses) {
    transformedOperation.responses = normalizedResponses;
  } else {
    delete transformedOperation.responses;
  }

  return transformedOperation;
}

function transformOperationTags(path: string, tags: string[]): string[] {
  const transformedTags = tags
    .map(tag => {
      const pathOverride = PATH_TAG_OVERRIDES.get(path);
      if (pathOverride) {
        return pathOverride;
      }

      if (REMOVED_OPERATION_TAGS.has(tag)) {
        return null;
      }

      const renamedTag = TAG_RENAMES.get(tag);
      return renamedTag === undefined ? tag : renamedTag;
    })
    .filter((tag): tag is string => tag !== null);

  return [...new Set(transformedTags)];
}

function transformParameters(parameters: OpenApiParameter[] | undefined): OpenApiParameter[] {
  const filteredParameters = (parameters ?? []).filter(
    parameter => !(parameter.in === 'header' && parameter.name && REMOVED_HEADER_NAMES.has(parameter.name)),
  );

  const hasSessionTokenHeader = filteredParameters.some(parameter => parameter.in === 'header' && parameter.name === SESSION_TOKEN_HEADER_NAME);

  if (!hasSessionTokenHeader) {
    filteredParameters.push({
      name: SESSION_TOKEN_HEADER_NAME,
      in: 'header',
      required: false,
      description: SESSION_TOKEN_HEADER_DESCRIPTION,
      schema: {
        type: 'string',
      },
    });
  }

  return filteredParameters;
}

function transformResponses(
  path: string,
  overrides: Record<string, string | null> | undefined,
  responses: Record<string, OpenApiResponse> | undefined,
): Record<string, OpenApiResponse> | undefined {
  if (!responses) {
    return responses;
  }

  const transformedResponses: Record<string, OpenApiResponse> = {};

  for (const [code, response] of Object.entries(responses)) {
    if (code === '401' || code === '402') {
      continue;
    }

    if (!isRecord(response)) {
      transformedResponses[code] = response as OpenApiResponse;
      continue;
    }

    const override = overrides?.[code];
    if (override === null) {
      continue;
    }

    if (code === '404' && !pathHasIdentifier(path) && override === undefined) {
      continue;
    }

    const normalizedDescription = normalizeResponseDescription(path, code, override ?? response.description);
    transformedResponses[code] = {
      ...response,
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
    };
  }

  for (const [code, override] of Object.entries(overrides ?? {})) {
    if (override === null || transformedResponses[code]) {
      continue;
    }

    transformedResponses[code] = { description: override };
  }

  return transformedResponses;
}

function buildTransformedTags(tags: OpenApiTag[], paths: Record<string, OpenApiPathItem>): OpenApiTag[] {
  const tagDetails = new Map<string, OpenApiTag>();

  for (const tag of tags) {
    if (!isRecord(tag) || typeof tag.name !== 'string') {
      continue;
    }

    if (HIDDEN_OPERATION_TAGS.has(tag.name) || REMOVED_OPERATION_TAGS.has(tag.name)) {
      continue;
    }

    const renamedTag = TAG_RENAMES.get(tag.name);
    const transformedName = renamedTag === undefined ? tag.name : renamedTag;

    const normalizedDescription = normalizeTagDescription(tag.description);
    tagDetails.set(
      transformedName,
      normalizedDescription
        ? {
            ...tag,
            name: transformedName,
            description: normalizedDescription,
          }
        : {
            ...tag,
            name: transformedName,
          },
    );
  }

  for (const pathItem of Object.values(paths)) {
    for (const operationValue of Object.values(pathItem)) {
      if (!isRecord(operationValue)) {
        continue;
      }

      const operation = operationValue as OpenApiOperation;
      for (const tagName of operation.tags ?? []) {
        if (!tagDetails.has(tagName)) {
          tagDetails.set(tagName, { name: tagName });
        }
      }
    }
  }

  return [...tagDetails.values()]
    .map(tag => {
      const resolvedDescription = resolveTagDescription(tag.name ?? '', tag.description, paths);
      return {
        ...tag,
        description: resolvedDescription,
      };
    })
    .sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''));
}

function resolveTagDescription(tagName: string, existingDescription: string | undefined, paths: Record<string, OpenApiPathItem>): string {
  const explicitDescription = TAG_DESCRIPTIONS.get(tagName);
  if (explicitDescription) {
    return explicitDescription;
  }

  if (existingDescription && !DESCRIPTION_PLACEHOLDERS.has(existingDescription)) {
    return existingDescription;
  }

  const firstOperation = findFirstOperationByTag(paths, tagName);
  if (firstOperation?.description) {
    return firstOperation.description;
  }

  if (firstOperation?.summary) {
    return `${firstOperation.summary}.`;
  }

  return `Operations related to ${humanizeTagName(tagName)}.`;
}

function findFirstOperationByTag(paths: Record<string, OpenApiPathItem>, tagName: string): Pick<OpenApiOperation, 'summary' | 'description'> | null {
  for (const pathItem of Object.values(paths)) {
    for (const operationValue of Object.values(pathItem)) {
      if (!isRecord(operationValue)) {
        continue;
      }

      const operation = operationValue as OpenApiOperation;
      if (operation.tags?.includes(tagName)) {
        const summary = normalizeSummary(operation.summary);
        const description = normalizeDescription(operation.description);

        return {
          ...(summary ? { summary } : {}),
          ...(description ? { description } : {}),
        };
      }
    }
  }

  return null;
}

function normalizeTagDescription(description: unknown): string | undefined {
  if (typeof description !== 'string') {
    return undefined;
  }

  const cleanedDescription = normalizeDescription(description.replace(STRIPPABLE_DESCRIPTION_PREFIX, '').trim());
  return cleanedDescription || undefined;
}

function normalizeSummary(summary: unknown): string | undefined {
  if (typeof summary !== 'string') {
    return undefined;
  }

  const cleanedSummary = normalizeText(summary);
  return cleanedSummary || undefined;
}

function normalizeDescription(description: unknown): string | undefined {
  if (typeof description !== 'string') {
    return undefined;
  }

  const cleanedDescription = normalizeText(description);
  return cleanedDescription || undefined;
}

function normalizeResponseDescription(path: string, code: string, description: unknown): string | undefined {
  if (typeof description === 'string' && description.trim().length > 0) {
    return normalizeText(description);
  }

  if (code === '400') {
    return 'The request is invalid.';
  }

  if (code === '401') {
    return 'Authentication is required.';
  }

  if (code === '402') {
    return 'No license is available or the app has not been authorized by JTL.';
  }

  if (code === '404' && pathHasIdentifier(path)) {
    return `No ${deriveResourceNameFromPath(path)} with the given ID exists.`;
  }

  if (code === '204') {
    return 'The request was processed successfully.';
  }

  return undefined;
}

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bavailabilites\b/gi, 'availabilities')
    .replace(/\blicence\b/gi, 'license')
    .replace(/\bauthorised\b/gi, 'authorized')
    .replace(/\bNo license available\b/g, 'No license is available')
    .replace(/\bTaxrate\b/g, 'tax rate')
    .replace(/\bTaxRate\b/g, 'tax rate')
    .replace(/\bNumberRange\b/g, 'number range')
    .replace(/\bNumberrange\b/g, 'number range')
    .replace(/\bNumberranges\b/g, 'number ranges')
    .replace(/\bFilestream\b/g, 'file stream')
    .replace(/\bMailjob\b/g, 'mail job')
    .replace(/\bMailJob\b/g, 'mail job')
    .replace(/\bPrintjob\b/g, 'print job')
    .replace(/\bPrintJob\b/g, 'print job')
    .replace(/\bpdf\b/g, 'PDF')
    .replace(/\bAPI version\b/g, 'API version')
    .replace(/\bREST-API\b/g, 'REST API')
    .replace(/\bfrom database\b/gi, 'from the database')
    .replace(/\ban given\b/gi, 'a given')
    .replace(/\bReturns the Available\b/g, 'Returns the available')
    .replace(/\bReturns the Status\b/g, 'Returns the status')
    .replace(/\bReturns the Taxrate\b/g, 'Returns the tax rate')
    .replace(/\bReturns the TaxRate\b/g, 'Returns the tax rate')
    .replace(/\bThe Action is Invoked\b/g, 'The action was triggered successfully.')
    .replace(/\bIMAGE\b/g, 'item image');
}

function pathHasIdentifier(path: string): boolean {
  return /\{[^}]+\}/.test(path);
}

function deriveResourceNameFromPath(path: string): string {
  const matches = [...path.matchAll(/\{([^}]+)\}/g)];
  const lastParameter = matches.at(-1)?.[1];

  if (!lastParameter) {
    return 'resource';
  }

  return humanizeTagName(lastParameter.replace(/Id$/i, ''));
}

function humanizeTagName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripByteOrderMark(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
