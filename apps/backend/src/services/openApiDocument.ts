type OpenApiDocument = {
  info?: Record<string, unknown>;
  [key: string]: unknown;
};

export function transformOpenApiDocument(documentText: string): string {
  const document = JSON.parse(stripByteOrderMark(documentText)) as OpenApiDocument;
  const existingInfo = isRecord(document.info) ? document.info : {};

  document.info = {
    ...existingInfo,
    description: 'Hallo Welt',
  };

  return JSON.stringify(document);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripByteOrderMark(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
