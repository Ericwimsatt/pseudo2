/**
 * Programmatic TypeScript parser used by the TranslationController.
 * Reuses the SourceFile-style parser but is intended for cases where
 * we only want the AST (e.g. type-only extraction from .d.ts).
 */

import ts from "typescript";
import type { Result } from "@source-narrator/shared";
import { ok, err } from "@source-narrator/shared";
import { parseTypeScriptSource, type ParseResult } from "./parse-source.js";

export const parseTypeScriptFile = (filePath: string, source: string): Result<ParseResult> =>
  parseTypeScriptSource({ filePath, source, scriptKind: ts.ScriptKind.TS });
