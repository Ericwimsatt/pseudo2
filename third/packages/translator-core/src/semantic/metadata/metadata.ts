export type MetadataKey = string;

export interface MetadataEntry {
  readonly key: MetadataKey;
  readonly value: unknown;
  readonly description?: string;
}
