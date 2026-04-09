import type { PathSegment } from "../types";

// --- Access patterns ---

export interface IndexerAccess {
  type: "indexer";
  /** Template with {value} placeholder, e.g. '["{value}"]' or '[{value}]' */
  template: string;
}

export interface MethodAccess {
  type: "method";
  /** The method/function name, e.g. "GetProperty" */
  methodName: string;
  /** Full template with {value} placeholder, e.g. '.GetProperty("{value}")' */
  template: string;
}

export type CaseTransform = "camelCase" | "PascalCase" | "snake_case";

export interface PropertyAccess {
  type: "property";
  separator: string;
  caseTransform: CaseTransform;
  invalidCharReplacement: string;
}

export type KeyAccess = IndexerAccess | MethodAccess | PropertyAccess;

// --- Serializer option (user-configurable toggle/input) ---

export interface SerializerOption {
  id: string;
  label: string;
  type: "boolean" | "string";
  default: unknown;
}

// --- Accessor definition: one per language/library ---

export interface AccessorDefinition {
  id: string;
  label: string;
  language: string;
  description: string;

  keyAccess: KeyAccess;
  indexAccess: IndexerAccess;

  stringQuote: '"' | "'" | "`";
  escapeRules: { char: string; replacement: string }[];

  nullSafe?: {
    keyAccess: KeyAccess;
    indexAccess: IndexerAccess;
  };

  options: SerializerOption[];
}

// --- Serializer: wraps a definition + generic serialize ---

export interface Serializer {
  definition: AccessorDefinition;
  serialize(path: PathSegment[], options: Record<string, unknown>): string;
}
