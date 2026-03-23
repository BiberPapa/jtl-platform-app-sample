export type OperationOverride = {
  summary?: string;
  description?: string;
  responses?: Record<string, string | null>;
};

export const HIDDEN_OPERATION_TAGS = new Set(['WawiApp']);
export const REMOVED_OPERATION_TAGS = new Set(['appRegistration', 'login', 'logout']);

export const TAG_RENAMES = new Map<string, string>([
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

export const REMOVED_HEADER_NAMES = new Set(['x-appid', 'x-appversion', 'x-runas', 'X-SessionId']);
export const SESSION_TOKEN_HEADER_NAME = 'X-Session-Token';
export const SESSION_TOKEN_HEADER_DESCRIPTION = 'The session token you obtained from the App Bridge.';

export const PATH_TAG_OVERRIDES = new Map<string, string>([
  ['/v2/availabilities', 'Item Configurations'],
  ['/v2/conditions', 'Item Configurations'],
  ['/v2/productGroups', 'Item Configurations'],
  ['/v2/responsiblePersons', 'Item Configurations'],
  ['/v2/shippingClasses', 'Item Configurations'],
  ['/v2/taxClasses', 'Item Configurations'],
]);

export const TAG_DESCRIPTIONS = new Map<string, string>([
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

export const OPERATION_OVERRIDES = new Map<string, OperationOverride>([
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
