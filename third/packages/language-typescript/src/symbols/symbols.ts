/**
 * Symbol kinds recognised by the TypeScript language service. The
 * set mirrors the typical kinds surfaced by the Language Server
 * Protocol and is intentionally small.
 */

export type TypeScriptSymbolKind =
  | "module"
  | "class"
  | "interface"
  | "function"
  | "method"
  | "property"
  | "variable"
  | "parameter"
  | "type"
  | "enum"
  | "alias";
