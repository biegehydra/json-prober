import type { PathSegment } from "../types";
import type { SearchOptions, SearchResult, JsonType } from "./types";
import { matchText, matchNumeric } from "./matchers";

function getJsonType(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as JsonType;
}

function stringifyValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function matchesValue(
  value: unknown,
  options: SearchOptions
): boolean {
  if (options.numericMode) {
    if (typeof value !== "number") return false;
    return matchNumeric(
      value,
      options.numericComparison,
      options.numericValue,
      options.numericValueEnd
    );
  }

  if (options.typeFilter.length > 0) {
    const t = getJsonType(value);
    if (!options.typeFilter.includes(t)) return false;
  }

  const str = stringifyValue(value);
  return matchText(str, options.query, options.matchType, options.caseSensitive);
}

function matchesKey(
  key: string,
  options: SearchOptions
): boolean {
  return matchText(key, options.query, options.matchType, options.caseSensitive);
}

export function searchJson(
  data: unknown,
  options: SearchOptions
): SearchResult[] {
  if (!options.query && !options.numericMode) return [];

  const results: SearchResult[] = [];
  const ignoreSet = new Set(options.ignoreKeys);

  function walk(node: unknown, path: PathSegment[], depth: number) {
    if (depth > options.maxDepth) return;
    if (results.length >= options.maxResults) return;

    if (node !== null && typeof node === "object" && !Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (ignoreSet.has(key)) continue;
        if (results.length >= options.maxResults) return;

        const childPath: PathSegment[] = [
          ...path,
          { type: "key", value: key },
        ];
        const childValue = obj[key];

        if (
          (options.mode === "key" || options.mode === "both") &&
          matchesKey(key, options)
        ) {
          results.push({
            path: childPath,
            matchedOn: "key",
            matchedKey: key,
            resolvedValue: childValue,
          });
        }

        walk(childValue, childPath, depth + 1);
      }
    } else if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (results.length >= options.maxResults) return;
        const childPath: PathSegment[] = [
          ...path,
          { type: "index", value: i },
        ];
        walk(node[i], childPath, depth + 1);
      }
    } else {
      if (
        (options.mode === "value" || options.mode === "both") &&
        matchesValue(node, options)
      ) {
        results.push({
          path,
          matchedOn: "value",
          matchedValue: node,
          resolvedValue: node,
        });
      }
    }
  }

  walk(data, [], 0);
  return results;
}

export function resolveJsonPath(
  data: unknown,
  path: PathSegment[]
): unknown {
  let current: unknown = data;
  for (const seg of path) {
    if (current === null || current === undefined) return undefined;
    if (seg.type === "key") {
      if (typeof current !== "object" || Array.isArray(current)) return undefined;
      current = (current as Record<string, unknown>)[seg.value];
    } else {
      if (!Array.isArray(current)) return undefined;
      current = current[seg.value];
    }
  }
  return current;
}
