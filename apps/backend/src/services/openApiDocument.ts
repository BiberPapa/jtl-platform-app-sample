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

type OperationOverride = {
  summary?: string;
  description?: string;
  responses?: Record<string, string | null>;
};

const HIDDEN_OPERATION_TAGS = new Set(['WawiApp']);
const REMOVED_OPERATION_TAGS = new Set(['appRegistration', 'login', 'logout']);

const TAG_RENAMES = new Map<string, string>([
  ['worker', 'Synchronizations'],
  ['wms', 'Warehouse Management'],
  ['warehouse', 'Business Configurations'],
  ['unitsOfMeasure', 'Item Configurations'],
  ['transactionStatus', 'Sales Orders Configurations'],
  ['tax', 'Tax Rate Calculation'],
  ['item', 'Items'],
  ['supplier', 'Procurement'],
  ['suppier', 'Procurement'],
  ['stock', 'Stocks'],
  ['shippingmethod', 'Business Configurations'],
  ['shipment', 'Shipment'],
  ['salesorder', 'Sales Orders'],
  ['cancellationreason', 'Invoice Document Configurations'],
  ['salesinvoicecorrection', 'Invoice Documents'],
  ['saleschannel', 'Sales Channels'],
  ['return', 'Returns'],
  ['returnstate', 'Return Configurations'],
  ['returnreason', 'Return Configurations'],
  ['property', 'Attributes'],
  ['printer', 'System Configurations'],
  ['paymentmethod', 'Business Configurations'],
  ['onholdreason', 'Sales Order Configurations'],
  ['offer', 'Sales Orders'],
  ['Configuration', 'Business Configurations'],
  ['manufacturer', 'Items Configurations'],
  ['label', 'Business Configurations'],
  ['duplicateItem', 'Items'],
  ['copyItem', 'Items'],
  ['invoice', 'Invoice Documents'],
  ['info', 'API Information'],
  ['Info', 'API Information'],
  ['features', 'API Information'],
]);

const REMOVED_HEADER_NAMES = new Set(['x-appid', 'x-appversion', 'x-runas', 'X-SessionId']);
const SESSION_TOKEN_HEADER_NAME = 'X-Session-Token';
const SESSION_TOKEN_HEADER_DESCRIPTION = 'The session token you obtained from the App Bridge.';

const PATH_TAG_OVERRIDES = new Map<string, string>([
  ['/v2/availabilities', 'Item Configurations'],
  ['/v2/conditions', 'Item Configurations'],
  ['/v2/productGroups', 'Item Configurations'],
  ['/v2/responsiblePersons', 'Item Configurations'],
  ['/v2/shippingClasses', 'Item Configurations'],
  ['/v2/taxClasses', 'Item Configurations'],
]);

const TAG_DESCRIPTIONS = new Map<string, string>([
  ['API Information', 'Check API status information and available feature sets.'],
  ['Attributes', 'Manage item properties, property values, descriptions, and property groups.'],
  [
    'Business Configurations',
    'Manage business-wide configuration resources such as warehouses, labels, payment methods, shipping methods, and number ranges.',
  ],
  ['Invoice Document Configurations', 'Access cancellation reasons used for invoice-related documents.'],
  ['Invoice Documents', 'Manage invoices and invoice-related document actions.'],
  [
    'Item Configurations',
    'Manage item-related configuration data such as availabilities, conditions, units of measure, product groups, responsible persons, shipping classes, and tax classes.',
  ],
  ['Items', 'Create, update, and manage items, item media, and item-specific resources.'],
  ['Items Configurations', 'Manage item master-data configurations such as manufacturers.'],
  ['Procurement', 'Access supplier data used in procurement processes.'],
  ['Return Configurations', 'Access return reasons and return states.'],
  ['Returns', 'Create and query returns together with their related items and packages.'],
  ['Sales Channel', 'Access available sales channels.'],
  ['Sales Channels', 'Access available sales channels.'],
  ['Sales Order Configurations', 'Access configuration data for sales orders, such as on-hold reasons.'],
  ['Sales Orders', 'Create and manage sales orders, related files, notes, documents, and workflow actions.'],
  ['Sales Orders Configurations', 'Access configuration data related to sales order transaction statuses.'],
  ['Shipment', 'Access shipment labels and package weight updates.'],
  ['Stocks', 'Query stock levels, stock changes, serial numbers, and stock adjustments.'],
  ['Synchronizations', 'Configure and monitor synchronization workers and their status.'],
  ['System Configurations', 'Access system-level configuration resources such as installed printers.'],
  ['Tax Rate Calculation', 'Calculate tax rates for items and tax classes based on company and shipping context.'],
  ['Warehouse Management', 'Manage WMS pick lists, reservations, and pick list templates.'],
]);

const OPERATION_OVERRIDES = new Map<string, OperationOverride>([
  [
    'GET /v2/feature',
    {
      summary: 'Get API Features',
      description: 'Retrieve the available feature sets, including their release state and API version.',
      responses: {
        200: 'The available feature sets, including their release state and API version.',
      },
    },
  ],
  [
    'GET /v2/info',
    {
      summary: 'Get API Status',
      description: 'Retrieve the current API status.',
      responses: {
        200: 'The current API status.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/availabilities',
    {
      summary: 'List Availabilities',
      description: 'Retrieve all item availabilities.',
      responses: {
        200: 'The available item availabilities.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/conditions',
    {
      summary: 'List Conditions',
      description: 'Retrieve all item conditions.',
      responses: {
        200: 'The available item conditions.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/productGroups',
    {
      summary: 'List Product Groups',
      description: 'Retrieve all product groups.',
      responses: {
        200: 'The available product groups.',
        404: null,
      },
    },
  ],
  [
    'POST /v2/productGroups',
    {
      summary: 'Create Product Group',
      description: 'Create a new product group.',
      responses: {
        201: 'The created product group.',
      },
    },
  ],
  [
    'PATCH /v2/productGroups/{id}',
    {
      summary: 'Update Product Group',
      description: 'Update a specific product group.',
      responses: {
        201: 'The updated product group.',
        404: 'No product group with the given ID exists.',
      },
    },
  ],
  [
    'DELETE /v2/productGroups/{id}',
    {
      summary: 'Delete Product Group',
      description: 'Delete a specific product group.',
      responses: {
        204: 'The product group was deleted successfully.',
        404: 'No product group with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/responsiblePersons',
    {
      summary: 'List Responsible Persons',
      description: 'Retrieve all responsible persons.',
      responses: {
        200: 'The available responsible persons.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/shippingClasses',
    {
      summary: 'List Shipping Classes',
      description: 'Retrieve all shipping classes.',
      responses: {
        200: 'The available shipping classes.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/taxClasses',
    {
      summary: 'List Tax Classes',
      description: 'Retrieve all tax classes.',
      responses: {
        200: 'The available tax classes.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/workers',
    {
      summary: 'List Synchronizations',
      description: 'Retrieve the available synchronization configurations.',
      responses: {
        200: 'The available synchronization configurations.',
        404: null,
      },
    },
  ],
  [
    'POST /v2/workers/{syncId}',
    {
      summary: 'Configure Synchronization',
      description: 'Update the configuration of a specific synchronization.',
      responses: {
        200: 'The updated synchronization configuration.',
        404: 'No synchronization with the given ID exists.',
      },
    },
  ],
  [
    'PUT /v2/workers/{syncId}',
    {
      summary: 'Control Synchronization',
      description: 'Trigger a control action for a specific synchronization.',
      responses: {
        204: 'The synchronization action was triggered successfully.',
        404: 'No synchronization with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/workers/status',
    {
      summary: 'Get Synchronization Status',
      description: 'Retrieve the current status of all synchronizations.',
      responses: {
        200: 'The current synchronization status.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/wms/{warehouseId}/picklists',
    {
      summary: 'List Pick Lists',
      description: 'Retrieve all open pick lists for a specific WMS warehouse.',
      responses: {
        200: 'The open pick lists for the specified WMS warehouse.',
        404: 'No WMS warehouse with the given ID exists.',
      },
    },
  ],
  [
    'POST /v2/wms/{warehouseId}/picklists',
    {
      summary: 'Create Pick List',
      description: 'Create a new pick list for a specific WMS warehouse.',
      responses: {
        201: 'The created pick list.',
        404: 'No WMS warehouse or pick list template with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/wms/{warehouseId}/picklists/{picklistId}',
    {
      summary: 'List Pick List Positions',
      description: 'Retrieve all positions for a specific pick list.',
      responses: {
        200: 'The positions of the specified pick list.',
        404: 'No WMS warehouse or pick list with the given ID exists.',
      },
    },
  ],
  [
    'DELETE /v2/wms/{warehouseId}/picklists/{picklistId}/positions/{picklistPositionId}',
    {
      summary: 'Delete Pick List Position',
      description: 'Delete a specific pick list position.',
      responses: {
        204: 'The pick list position was deleted successfully.',
        404: 'No WMS warehouse, pick list, or pick list position with the given ID exists.',
      },
    },
  ],
  [
    'PATCH /v2/wms/{warehouseId}/picklists/{picklistId}/positions/{picklistPositionId}/changeReservation',
    {
      summary: 'Update Pick List Reservation',
      description: 'Update the reservation of a specific pick list position.',
      responses: {
        200: 'The updated pick list positions.',
        404: 'No WMS warehouse, pick list, or pick list position with the given ID exists.',
      },
    },
  ],
  [
    'PATCH /v2/wms/{warehouseId}/picklists/{picklistId}/positions/{picklistPositionId}/pickPosition',
    {
      summary: 'Pick Pick List Position',
      description: 'Pick a specific pick list position.',
      responses: {
        200: 'The updated pick list position.',
        404: 'No WMS warehouse, pick list, or pick list position with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/wms/picklisttemplates',
    {
      summary: 'List Pick List Templates',
      description: 'Retrieve all pick list templates used to create new pick lists.',
      responses: {
        200: 'The available pick list templates.',
      },
    },
  ],
  [
    'GET /v2/configuration/numberRanges',
    {
      summary: 'List Number Ranges',
      description: 'Retrieve all available number ranges.',
      responses: {
        200: 'The available number ranges.',
      },
    },
  ],
  [
    'GET /v2/configuration/numberRanges/{numberRangeId}',
    {
      summary: 'Get Number Range',
      description: 'Retrieve a specific number range.',
      responses: {
        200: 'The requested number range.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'POST /v2/configuration/numberRanges/{numberRangeId}',
    {
      summary: 'Create Number Range',
      description: 'Create a new number range based on a specific number range.',
      responses: {
        201: 'The created number range.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'PUT /v2/configuration/numberRanges/{numberRangeId}',
    {
      summary: 'Update Number Range',
      description: 'Update a specific number range.',
      responses: {
        201: 'The updated number range.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'DELETE /v2/configuration/numberRanges/{numberRangeId}',
    {
      summary: 'Delete Number Range',
      description: 'Delete a specific number range.',
      responses: {
        204: 'The number range was deleted successfully.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'POST /v2/configuration/numberRanges/{numberRangeId}/increment',
    {
      summary: 'Increment Number Range',
      description: 'Increment a specific number range and return the next number.',
      responses: {
        201: 'The next number of the specified number range.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/configuration/numberRanges/{numberRangeId}/preview',
    {
      summary: 'Preview Number Range',
      description: 'Preview the next number of a specific number range.',
      responses: {
        200: 'The next number of the specified number range.',
        404: 'No number range with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/tax/item/{itemId}/{companyId}/{departureCountryISO}/{shipmentCountryISO}',
    {
      summary: 'Calculate Tax Rate for Item',
      description: 'Calculate the tax rate for a specific item.',
      responses: {
        200: 'The calculated tax rate for the specified item.',
        404: 'No item with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/tax/taxclass/{taxClassId}/{companyId}/{departureCountryISO}/{shipmentCountryISO}',
    {
      summary: 'Calculate Tax Rate for Tax Class',
      description: 'Calculate the tax rate for a specific tax class.',
      responses: {
        200: 'The calculated tax rate for the specified tax class.',
        404: 'No tax class with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/transactionStatuses',
    {
      summary: 'List Transaction Statuses',
      description: 'Retrieve all transaction statuses for sales orders.',
      responses: {
        200: 'The available transaction statuses for sales orders.',
      },
    },
  ],
  [
    'GET /v2/shippingMethods',
    {
      summary: 'List Shipping Methods',
      description: 'Retrieve all shipping methods.',
      responses: {
        200: 'The available shipping methods.',
      },
    },
  ],
  [
    'GET /v2/paymentMethods',
    {
      summary: 'List Payment Methods',
      description: 'Retrieve all payment methods.',
      responses: {
        200: 'The available payment methods.',
      },
    },
  ],
  [
    'GET /v2/warehouses',
    {
      summary: 'List Warehouses',
      description: 'Retrieve all warehouses.',
      responses: {
        200: 'The available warehouses.',
      },
    },
  ],
  [
    'GET /v2/warehouses/{warehouseId}/storagelocations',
    {
      summary: 'List Storage Locations',
      description: 'Retrieve all storage locations for a specific warehouse.',
      responses: {
        200: 'The storage locations of the specified warehouse.',
        404: 'No warehouse with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/warehouses/storagelocationtypes',
    {
      summary: 'List Storage Location Types',
      description: 'Retrieve all storage location types.',
      responses: {
        200: 'The available storage location types.',
      },
    },
  ],
  [
    'GET /v2/warehouses/types',
    {
      summary: 'List Warehouse Types',
      description: 'Retrieve all warehouse types.',
      responses: {
        200: 'The available warehouse types.',
      },
    },
  ],
  [
    'GET /v2/shipment/label/{packageId}',
    {
      summary: 'Download Shipping Label',
      description: 'Download the shipping label PDF for a specific package.',
      responses: {
        200: 'The shipping label PDF as binary content.',
        404: 'No package with the given ID exists or no shipping label is available for it.',
      },
    },
  ],
  [
    'POST /v2/shipment/wms/shippingLine/packages/{packageId}/packageWeight',
    {
      summary: 'Update Package Weight',
      description: 'Update the weight of a specific package.',
      responses: {
        201: 'The updated package weight.',
        404: 'No package with the given ID exists.',
      },
    },
  ],
  [
    'GET /v2/stocks',
    {
      summary: 'List Stocks',
      description: 'Retrieve stocks for a specific item, warehouse, or storage location.',
      responses: {
        200: 'The requested stock information.',
        404: null,
      },
    },
  ],
  [
    'POST /v2/stocks',
    {
      summary: 'Create Stock Adjustment',
      description: 'Create a stock adjustment for a specific item.',
      responses: {
        201: 'The created stock adjustment.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/stocks/changes',
    {
      summary: 'List Stock Changes',
      description: 'Retrieve stock changes for a specific item from a given start date.',
      responses: {
        200: 'The requested stock changes.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/stocks/serialnumbers',
    {
      summary: 'List Serial Numbers',
      description: 'Retrieve serial numbers for a specific item and warehouse.',
      responses: {
        200: 'The requested serial numbers for the specified item and warehouse.',
        404: null,
      },
    },
  ],
  [
    'GET /v2/suppliers',
    {
      summary: 'List Suppliers',
      description: 'Retrieve all suppliers.',
      responses: {
        200: 'The available suppliers.',
      },
    },
  ],
  [
    'GET /v2/printers',
    {
      summary: 'List Installed Printers',
      description: 'Retrieve all installed printers.',
      responses: {
        200: 'The installed printers.',
      },
    },
  ],
]);

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
