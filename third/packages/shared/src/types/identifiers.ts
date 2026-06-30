/**
 * Branded identifiers for distinct entity kinds.
 * Branded types prevent accidental cross-assignment of unrelated IDs.
 */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type RepositoryId = Brand<string, "RepositoryId">;
export type FileId = Brand<string, "FileId">;
export type SemanticNodeId = Brand<string, "SemanticNodeId">;
export type AstNodeId = Brand<string, "AstNodeId">;

export const asRepositoryId = (raw: string): RepositoryId => raw as RepositoryId;
export const asFileId = (raw: string): FileId => raw as FileId;
export const asSemanticNodeId = (raw: string): SemanticNodeId => raw as SemanticNodeId;
export const asAstNodeId = (raw: string): AstNodeId => raw as AstNodeId;

/**
 * Stable, human-readable identifier for entities.
 * Derived from the file path, line/column, and entity kind.
 */
export type StableId = string;
