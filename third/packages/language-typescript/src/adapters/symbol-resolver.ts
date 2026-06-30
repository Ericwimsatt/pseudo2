/**
 * Symbol resolution is currently a no-op placeholder. Real symbol
 * tables will be built off the TypeScript program so that references
 * between files can be resolved during semantic generation.
 */

import type { SemanticNodeId } from "@source-narrator/shared";

export interface SymbolTable {
  resolve(name: string): SemanticNodeId | null;
}

export const emptySymbolTable = (): SymbolTable => ({
  resolve: () => null,
});
