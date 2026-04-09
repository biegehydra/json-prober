import type { PathSegment } from "./types";
import type { PropertyAccess } from "./serializers/types";
import { reverseTransformKey, transformKey } from "./case-transforms";

function unescapeKey(raw: string, quote: string): string {
  return raw
    .replace(new RegExp(`\\\\${quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), quote)
    .replace(/\\\\/g, "\\");
}

/**
 * Extract the root variable from a path string.
 * Returns everything before the first accessor (bracket, dot-method, or optional chaining).
 */
export function extractRootVar(input: string): string {
  const match = input.match(/^([^.[?]+)/);
  return match ? match[1] : input;
}

/**
 * Parse a path string into PathSegments.
 * Handles mixed formats including bracket notation, method notation,
 * and bare dot-property notation:
 *   root["data"]["sections"][6]
 *   root['key'][0]
 *   root?.["key"]?.[0]
 *   root.GetProperty("key")[0]
 *   root.get("key").get(0)
 *   root.FirstName[0].Address   (dot-property)
 */
export function parseBracketPath(input: string): PathSegment[] {
  const cleaned = input.replace(/\?\[/g, "[").replace(/\?\.\[/g, "[").replace(/\?\./g, ".");

  const segments: PathSegment[] = [];

  // Combined regex: bracket-quoted, bracket-index, method-call, and bare dot-property.
  // Bare dot-property uses negative lookahead for '(' to avoid matching method calls.
  const combined =
    /\[\s*"((?:[^"\\]|\\.)*)"\s*\]|\[\s*'((?:[^'\\]|\\.)*)'\s*\]|\[\s*(\d+)\s*\]|\.\w+\(\s*"((?:[^"\\]|\\.)*)"\s*\)|\.\w+\(\s*'((?:[^'\\]|\\.)*)'\s*\)|\.\w+\(\s*(\d+)\s*\)|\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?!\s*\()/g;

  for (const m of cleaned.matchAll(combined)) {
    if (m[1] !== undefined) {
      segments.push({ type: "key", value: unescapeKey(m[1], '"') });
    } else if (m[2] !== undefined) {
      segments.push({ type: "key", value: unescapeKey(m[2], "'") });
    } else if (m[3] !== undefined) {
      segments.push({ type: "index", value: parseInt(m[3], 10) });
    } else if (m[4] !== undefined) {
      segments.push({ type: "key", value: unescapeKey(m[4], '"') });
    } else if (m[5] !== undefined) {
      segments.push({ type: "key", value: unescapeKey(m[5], "'") });
    } else if (m[6] !== undefined) {
      segments.push({ type: "index", value: parseInt(m[6], 10) });
    } else if (m[7] !== undefined) {
      segments.push({ type: "key", value: m[7] });
    }
  }

  return segments;
}

/**
 * Reconcile path segments that may contain case-transformed keys
 * back to the original JSON keys by walking the JSON tree.
 * Returns the reconciled segments and any ambiguity errors.
 */
export function reconcileSegments(
  segments: PathSegment[],
  jsonData: unknown,
  access: PropertyAccess
): { segments: PathSegment[]; ambiguousAt?: number } {
  const result: PathSegment[] = [];
  let current: unknown = jsonData;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === "index") {
      result.push(seg);
      if (Array.isArray(current) && seg.value >= 0 && seg.value < current.length) {
        current = current[seg.value];
      } else {
        current = undefined;
      }
      continue;
    }

    // Key segment: try exact match first, then reverse transform
    if (typeof current === "object" && current !== null && !Array.isArray(current)) {
      const obj = current as Record<string, unknown>;

      if (seg.value in obj) {
        result.push(seg);
        current = obj[seg.value];
        continue;
      }

      const { originalKey, ambiguous } = reverseTransformKey(seg.value, obj, access);
      if (ambiguous) {
        result.push(seg);
        return { segments: result, ambiguousAt: i };
      }
      if (originalKey !== null) {
        result.push({ type: "key", value: originalKey });
        current = obj[originalKey];
        continue;
      }
    }

    result.push(seg);
    current = undefined;
  }

  return { segments: result };
}

export interface AmbiguityInfo {
  segmentIndex: number;
  transformedKey: string;
  originalKeys: string[];
}

/**
 * Check an entire path for ambiguity against the JSON data using a property access definition.
 * Returns info about the first ambiguous segment found, or null if unambiguous.
 */
export function checkPathAmbiguity(
  path: PathSegment[],
  jsonData: unknown,
  access: PropertyAccess
): AmbiguityInfo | null {
  let current: unknown = jsonData;

  for (let i = 0; i < path.length; i++) {
    const seg = path[i];

    if (seg.type === "index") {
      if (Array.isArray(current) && seg.value >= 0 && seg.value < current.length) {
        current = current[seg.value];
      } else {
        return null;
      }
      continue;
    }

    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return null;
    }

    const obj = current as Record<string, unknown>;
    const transformed = transformKey(seg.value, access);
    const matches: string[] = [];
    for (const key of Object.keys(obj)) {
      if (transformKey(key, access) === transformed) {
        matches.push(key);
      }
    }

    if (matches.length > 1) {
      return { segmentIndex: i, transformedKey: transformed, originalKeys: matches };
    }

    if (matches.length === 1) {
      current = obj[matches[0]];
    } else {
      return null;
    }
  }

  return null;
}

export function resolvePathSegments(
  data: unknown,
  segments: PathSegment[]
): { value: unknown; error?: string } {
  let current: unknown = data;

  for (let i = 0; i < segments.length; i++) {
    if (current === null || current === undefined) {
      return { value: undefined, error: `Path is null/undefined at segment ${i}` };
    }

    const seg = segments[i];

    if (seg.type === "key") {
      if (typeof current !== "object" || Array.isArray(current)) {
        return {
          value: undefined,
          error: `Expected object at segment ${i}, got ${Array.isArray(current) ? "array" : typeof current}`,
        };
      }
      const obj = current as Record<string, unknown>;
      if (!(seg.value in obj)) {
        return { value: undefined, error: `Key "${seg.value}" not found` };
      }
      current = obj[seg.value];
    } else {
      if (!Array.isArray(current)) {
        return {
          value: undefined,
          error: `Expected array at segment ${i}, got ${typeof current}`,
        };
      }
      if (seg.value < 0 || seg.value >= current.length) {
        return {
          value: undefined,
          error: `Index [${seg.value}] out of range (length ${current.length})`,
        };
      }
      current = current[seg.value];
    }
  }

  return { value: current };
}
