import type { CaseTransform, PropertyAccess } from "./serializers/types";

/**
 * Split a key into word tokens by recognizing:
 * - underscores, hyphens, spaces, dots as delimiters
 * - camelCase boundaries (lowercase -> uppercase transition)
 * - runs of uppercase followed by lowercase (e.g. "XMLParser" -> ["XML", "Parser"])
 */
function splitWords(key: string): string[] {
  const replaced = key
    .replace(/[_\-.\s]+/g, "\0")
    .replace(/([a-z])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2");

  return replaced.split("\0").filter((w) => w.length > 0);
}

export function toCamelCase(key: string): string {
  const words = splitWords(key);
  if (words.length === 0) return key;
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

export function toPascalCase(key: string): string {
  const words = splitWords(key);
  if (words.length === 0) return key;
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function toSnakeCase(key: string): string {
  const words = splitWords(key);
  if (words.length === 0) return key;
  return words.map((w) => w.toLowerCase()).join("_");
}

const TRANSFORM_FNS: Record<CaseTransform, (key: string) => string> = {
  camelCase: toCamelCase,
  PascalCase: toPascalCase,
  snake_case: toSnakeCase,
};

export function applyCaseTransform(key: string, transform: CaseTransform): string {
  return TRANSFORM_FNS[transform](key);
}

/**
 * Replace characters not valid in an identifier with the given replacement.
 * Keeps letters, digits, underscores, and $ signs.
 * Prefixes with "_" if the result starts with a digit.
 */
export function sanitizeIdentifier(key: string, replacement: string): string {
  let result = key.replace(/[^a-zA-Z0-9_$]/g, replacement);
  if (/^\d/.test(result)) result = "_" + result;
  return result;
}

export function transformKey(key: string, access: PropertyAccess): string {
  const sanitized = sanitizeIdentifier(key, access.invalidCharReplacement);
  return applyCaseTransform(sanitized, access.caseTransform);
}

/**
 * Find all keys in an object that produce the same transformed name.
 * Returns the set of original keys that collide on `transformedName`.
 */
export function findAmbiguousKeys(
  obj: Record<string, unknown>,
  access: PropertyAccess
): Map<string, string[]> {
  const byTransformed = new Map<string, string[]>();
  for (const key of Object.keys(obj)) {
    const transformed = transformKey(key, access);
    const existing = byTransformed.get(transformed);
    if (existing) {
      existing.push(key);
    } else {
      byTransformed.set(transformed, [key]);
    }
  }
  const ambiguous = new Map<string, string[]>();
  for (const [transformed, keys] of byTransformed) {
    if (keys.length > 1) {
      ambiguous.set(transformed, keys);
    }
  }
  return ambiguous;
}

/**
 * Check whether a specific transformed key is ambiguous within the given object.
 */
export function isKeyAmbiguous(
  transformedKey: string,
  obj: Record<string, unknown>,
  access: PropertyAccess
): boolean {
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (transformKey(key, access) === transformedKey) {
      count++;
      if (count > 1) return true;
    }
  }
  return false;
}

/**
 * Reverse-map a transformed key back to the original JSON key.
 * Returns null if no match or if ambiguous.
 */
export function reverseTransformKey(
  transformedKey: string,
  obj: Record<string, unknown>,
  access: PropertyAccess
): { originalKey: string | null; ambiguous: boolean } {
  const matches: string[] = [];
  for (const key of Object.keys(obj)) {
    if (transformKey(key, access) === transformedKey) {
      matches.push(key);
    }
  }
  if (matches.length === 1) return { originalKey: matches[0], ambiguous: false };
  if (matches.length > 1) return { originalKey: null, ambiguous: true };
  return { originalKey: null, ambiguous: false };
}
