export function transformGraphQlSchema(schemaText: string): string {
  return stripByteOrderMark(schemaText);
}

function stripByteOrderMark(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
