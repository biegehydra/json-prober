import type { PathSegment } from "./types";

/**
 * Parse a path string into PathSegments.
 * Handles mixed formats:
 *   root["data"]["sections"][6]["lat"]
 *   root?["data"]?["sections"]?[6]?["lat"]
 *   root.GetProperty("data").GetProperty("sections")[6]
 *   root.Method("key")[0].Method("other")
 */
export function parseBracketPath(input: string): PathSegment[] {
  const cleaned = input.replace(/\?\[/g, "[").replace(/\?\./g, ".");

  const segments: PathSegment[] = [];
  const combined =
    /\[\s*"((?:[^"\\]|\\.)*)"\s*\]|\[\s*(\d+)\s*\]|\.\w+\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g;

  for (const m of cleaned.matchAll(combined)) {
    if (m[1] !== undefined) {
      segments.push({
        type: "key",
        value: m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
      });
    } else if (m[2] !== undefined) {
      segments.push({ type: "index", value: parseInt(m[2], 10) });
    } else if (m[3] !== undefined) {
      segments.push({
        type: "key",
        value: m[3].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
      });
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
