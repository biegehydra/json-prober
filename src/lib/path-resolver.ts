import type { PathSegment } from "./types";

function unescapeKey(raw: string, quote: string): string {
  return raw
    .replace(new RegExp(`\\\\${quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), quote)
    .replace(/\\\\/g, "\\");
}

/**
 * Parse a path string into PathSegments.
 * Handles mixed formats including bracket and method notation
 * with both double and single quoted strings:
 *   root["data"]["sections"][6]
 *   root['key'][0]
 *   root?.["key"]?.[0]
 *   root.GetProperty("key")[0]
 *   root.get("key").get(0)
 */
/**
 * Extract the root variable from a path string.
 * Returns everything before the first accessor (bracket, dot-method, or optional chaining).
 */
export function extractRootVar(input: string): string {
  const match = input.match(/^([^.[?]+)/);
  return match ? match[1] : input;
}

export function parseBracketPath(input: string): PathSegment[] {
  const cleaned = input.replace(/\?\[/g, "[").replace(/\?\.\[/g, "[").replace(/\?\./g, ".");

  const segments: PathSegment[] = [];

  const combined =
    /\[\s*"((?:[^"\\]|\\.)*)"\s*\]|\[\s*'((?:[^'\\]|\\.)*)'\s*\]|\[\s*(\d+)\s*\]|\.\w+\(\s*"((?:[^"\\]|\\.)*)"\s*\)|\.\w+\(\s*'((?:[^'\\]|\\.)*)'\s*\)|\.\w+\(\s*(\d+)\s*\)/g;

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
    }
  }

  return segments;
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
