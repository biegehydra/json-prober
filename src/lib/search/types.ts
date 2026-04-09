import type { PathSegment } from "../types";

export type MatchType =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "regex";

export type NumericComparison = "eq" | "gt" | "gte" | "lt" | "lte" | "between";

export type JsonType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "object"
  | "array";

export type SearchMode = "value" | "key" | "both";

export interface SearchOptions {
  mode: SearchMode;
  query: string;
  matchType: MatchType;
  caseSensitive: boolean;
  numericMode: boolean;
  numericComparison: NumericComparison;
  numericValue: number;
  numericValueEnd: number;
  typeFilter: JsonType[];
  ignoreKeys: string[];
  maxDepth: number;
  maxResults: number;
}

export interface SearchResult {
  path: PathSegment[];
  matchedOn: "key" | "value";
  matchedKey?: string;
  matchedValue?: unknown;
  resolvedValue?: unknown;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  mode: "value",
  query: "",
  matchType: "contains",
  caseSensitive: false,
  numericMode: false,
  numericComparison: "eq",
  numericValue: 0,
  numericValueEnd: 0,
  typeFilter: [],
  ignoreKeys: [],
  maxDepth: 50,
  maxResults: 200,
};
