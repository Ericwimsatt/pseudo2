/**
 * The English Renderer is the only consumer of the SemanticGraph.
 * It must never import anything from a language-specific package.
 *
 * A renderer is a pure function: SemanticGraph in, EnglishLine[] out.
 * Renderers can be swapped or composed (e.g. for a second language
 * localisation) without touching the rest of the pipeline.
 *
 * Rendering strategy
 * ------------------
 * Every node becomes one EnglishLine. The depth of the node in the
 * graph controls the indentation of the line so the resulting text
 * reads like an outline of the file. The line's `text` is a
 * natural-sounding sentence derived from the node's kind and
 * metadata; the default description in each case is intentionally
 * generic so the renderer never has to consult the source language.
 *
 * Extending the renderer
 *   - Add a new sentence by adding a case to the switch on kind.
 *   - Add metadata fields to the node in your adapter; they will be
 *     available via `node.metadata` here.
 *   - Use `paragraphId` to group related lines into a paragraph
 *     (e.g. one paragraph per top-level declaration).
 */

import type { SemanticNode, SemanticNodeKind } from "../../semantic/nodes/semantic-node.js";
import type { SemanticGraph } from "../../semantic/semantic-graph.js";
import type { EnglishLine } from "./english-line.js";

export interface EnglishRenderer {
  readonly id: string;
  readonly displayName: string;
  render(graph: SemanticGraph): readonly EnglishLine[];
}

const describeKind = (node: SemanticNode): string => {
  switch (node.kind as SemanticNodeKind) {
    case "file":
      return `This is the file ${node.name ?? "?"}.`;
    case "function":
      return node.name
        ? `A function named ${node.name} is defined.`
        : `An anonymous function is defined.`;
    case "method":
      return node.name === "constructor"
        ? `A constructor is defined.`
        : `A method named ${node.name} is defined.`;
    case "class":
      return node.name ? `A class named ${node.name} is defined.` : `An anonymous class is defined.`;
    case "interface":
      return `An interface named ${node.name ?? "?"} is defined.`;
    case "type-alias": {
      const isEnum = (node.metadata as { kind?: string }).kind === "enum";
      return isEnum
        ? `An enum named ${node.name ?? "?"} is defined.`
        : `A type alias named ${node.name ?? "?"} is defined.`;
    }
    case "variable":
      return `A variable named ${node.name ?? "?"} is declared.`;
    case "parameter": {
      const meta = node.metadata as { optional?: boolean; hasDefault?: boolean };
      const suffix = meta.optional ? " (optional)" : meta.hasDefault ? " (with default)" : "";
      return `A parameter named ${node.name ?? "?"}${suffix} is declared.`;
    }
    case "property":
      return `A property named ${node.name ?? "?"} is declared.`;
    case "loop": {
      const meta = node.metadata as { kind?: string };
      if (meta.kind === "ForOfStatement") return `A for-of loop iterates over a collection.`;
      if (meta.kind === "ForInStatement") return `A for-in loop iterates over the keys of an object.`;
      if (meta.kind === "WhileStatement" || meta.kind === "DoStatement") return `A while loop runs while a condition is true.`;
      return `A loop runs.`;
    }
    case "conditional": {
      const meta = node.metadata as { kind?: string; hasElse?: boolean };
      if (meta.kind === "switch") return `A switch statement dispatches to one of several cases.`;
      return meta.hasElse
        ? `An if-statement checks a condition and may run an else branch.`
        : `An if-statement checks a condition.`;
    }
    case "assignment":
      return node.name
        ? `A value is assigned to ${node.name}.`
        : `A value is assigned.`;
    case "return":
      return (node.metadata as { hasValue?: boolean }).hasValue
        ? `A value is returned.`
        : `The function returns without a value.`;
    case "expression": {
      const meta = node.metadata as { kind?: string; truncated?: boolean };
      if (meta.kind === "throw") return `An error is thrown.`;
      if (meta.truncated) return `An expression is evaluated.`;
      return `An expression is evaluated.`;
    }
    case "call": {
      const meta = node.metadata as { callee?: string; argCount?: number };
      const name = meta.callee ?? node.name ?? "?";
      const argCount = meta.argCount ?? 0;
      const argPart =
        argCount === 0 ? " with no arguments" : ` with ${argCount} argument${argCount === 1 ? "" : "s"}`;
      if (name.includes(".")) {
        const [target, member] = name.split(".");
        return `The method ${member} is called on ${target}${argPart}.`;
      }
      return `The function ${name} is called${argPart}.`;
    }
    case "import": {
      const meta = node.metadata as { module?: string; defaultName?: string | null; named?: readonly string[] };
      const module = meta.module ?? node.name ?? "?";
      if (meta.defaultName && meta.named && meta.named.length > 0) {
        return `The default export ${meta.defaultName} and the bindings ${meta.named.join(", ")} are imported from "${module}".`;
      }
      if (meta.defaultName) {
        return `The default export ${meta.defaultName} is imported from "${module}".`;
      }
      if (meta.named && meta.named.length > 0) {
        if (meta.named.length === 1) {
          return `The binding ${meta.named[0]} is imported from "${module}".`;
        }
        return `The bindings ${meta.named.join(", ")} are imported from "${module}".`;
      }
      return `Side effects are imported from "${module}".`;
    }
    case "export": {
      const text = node.text || "An export is declared.";
      return text;
    }
    case "block": {
      const meta = node.metadata as { hasCatch?: boolean; hasFinally?: boolean };
      if (meta.hasCatch || meta.hasFinally) return `A try-catch block handles errors.`;
      return `A block of statements runs.`;
    }
    case "comment":
      return `A comment is present.`;
    case "literal": {
      const meta = node.metadata as { kind?: string; value?: unknown };
      if (meta.kind === "number") return `The number ${node.name ?? meta.value ?? "?"} is used.`;
      if (meta.kind === "string") return `The text ${JSON.stringify(node.name ?? meta.value ?? "")} is used.`;
      if (meta.kind === "boolean") return `The boolean value ${node.name ?? meta.value} is used.`;
      return `A literal value is used.`;
    }
    case "identifier":
      return `A reference to ${node.name ?? "?"} is used.`;
    case "operator":
      return `An operator is applied.`;
    case "unknown":
    default:
      return `An unrecognised construct appears at line ${node.source.start.line}.`;
  }
};

export const createEnglishRenderer = (params?: {
  id?: string;
  displayName?: string;
}): EnglishRenderer => ({
  id: params?.id ?? "english-default",
  displayName: params?.displayName ?? "English",
  render(graph) {
    const lines: EnglishLine[] = [];
    let lineIndex = 0;
    const visit = (node: SemanticNode, depth: number, paragraphId: string | undefined): void => {
      const text = describeKind(node);
      lines.push({
        lineIndex: lineIndex++,
        text: "  ".repeat(depth) + text,
        semanticNodeIds: [node.id],
        astNodeIds: [],
        indentation: depth,
        sourceRange: node.source,
        ...(paragraphId ? { paragraphId } : {}),
      });
      for (const c of node.children) visit(c, depth + 1, paragraphId);
    };
    // Top-level children of the file form their own paragraph so
    // the EnglishView can render them as discrete sections.
    for (const root of graph.nodes) {
      if (root.kind === "file") {
        for (const child of root.children) {
          visit(child, 0, child.id);
        }
      } else if (root.parentId === null) {
        visit(root, 0, undefined);
      }
    }
    return lines;
  },
});

/** Convenience renderer for tests; flattens the graph into single lines. */
export const flattenEnglish = (graph: SemanticGraph): readonly EnglishLine[] => {
  const out: EnglishLine[] = [];
  let i = 0;
  for (const root of graph.nodes) {
    if (root.parentId !== null) continue;
    const visit = (n: SemanticNode): void => {
      out.push({
        lineIndex: i++,
        text: describeKind(n),
        semanticNodeIds: [n.id],
        astNodeIds: [],
        indentation: 0,
        sourceRange: n.source,
      });
      for (const c of n.children) visit(c);
    };
    visit(root);
  }
  return out;
};
