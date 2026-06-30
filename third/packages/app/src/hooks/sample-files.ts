/**
 * Sample repository content used as a default "load this" target.
 * Keeps the app useful even when the user has not granted file
 * system access — they can open a curated example to explore the UI.
 */

import type { InMemoryFile } from "../infrastructure/fs-memory.js";

export const SAMPLE_FILES: readonly InMemoryFile[] = [
  {
    path: "src/parser/parser.ts",
    content: `import { tokenize } from "./tokenize";

/** Parse an expression into an AST node. */
export function parseExpression(input: string): number {
  const tokens = tokenize(input);
  let value = 0;
  for (const token of tokens) {
    if (token.type === "number") {
      value = value + token.value;
    } else if (token.type === "plus") {
      continue;
    }
  }
  return value;
}

export class Parser {
  constructor(private readonly source: string) {}

  parse(): number {
    return parseExpression(this.source);
  }
}
`,
  },
  {
    path: "src/parser/tokenize.ts",
    content: `export type Token = { type: "number" | "plus"; value: number };

export function tokenize(input: string): Token[] {
  const result: Token[] = [];
  for (const ch of input) {
    if (ch === "+") result.push({ type: "plus", value: 0 });
    else if (/\\d/.test(ch)) result.push({ type: "number", value: Number(ch) });
  }
  return result;
}
`,
  },
  {
    path: "src/renderer/english.ts",
    content: `import type { SemanticNode } from "../semantic/semantic-node";

export function renderEnglish(nodes: SemanticNode[]): string {
  return nodes.map(renderNode).join("\\n");
}

function renderNode(node: SemanticNode): string {
  if (node.kind === "function") return \`Function \${node.name}.\`;
  if (node.kind === "class") return \`Class \${node.name}.\`;
  return \`Unknown \${node.kind}.\`;
}
`,
  },
  {
    path: "src/main.ts",
    content: `import { parseExpression } from "./parser/parser";
import { renderEnglish } from "./renderer/english";
import { tokenize } from "./parser/tokenize";

const tokens = tokenize("1+2+3");
const value = parseExpression("1+2+3");
const english = renderEnglish([]);

console.log({ tokens, value, english });
`,
  },
  {
    path: "README.md",
    content: `# Sample Repository

This is a small in-memory repository that loads automatically the
first time you open the app. It lets you explore the UI before
granting the app access to a real local folder.
`,
  },
];
