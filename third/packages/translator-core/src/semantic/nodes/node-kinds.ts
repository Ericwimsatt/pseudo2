/**
 * Closed set of semantic node kinds. Adding a new language should
 * never require changing this set — only the adapter that produces
 * the corresponding kind. The English renderer dispatches on these
 * kinds only.
 */

export type SemanticNodeKind =
  | "file"
  | "function"
  | "method"
  | "class"
  | "interface"
  | "variable"
  | "parameter"
  | "loop"
  | "conditional"
  | "assignment"
  | "return"
  | "expression"
  | "call"
  | "import"
  | "export"
  | "block"
  | "comment"
  | "type-alias"
  | "property"
  | "literal"
  | "identifier"
  | "operator"
  | "unknown";
