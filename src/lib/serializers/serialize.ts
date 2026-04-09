import type { PathSegment } from "../types";
import { parseBracketPath, extractRootVar } from "../path-resolver";
import type { AccessorDefinition, Serializer } from "./types";

function applyEscapes(
  value: string,
  rules: { char: string; replacement: string }[]
): string {
  let result = value;
  for (const rule of rules) {
    result = result.replaceAll(rule.char, rule.replacement);
  }
  return result;
}

export function serializeFromDefinition(
  def: AccessorDefinition,
  path: PathSegment[],
  options: Record<string, unknown>
): string {
  const rootVar = (options.rootVar as string) || "root";
  const useNullSafe = options.nullSafe === true && !!def.nullSafe;

  let result = rootVar;

  for (const seg of path) {
    if (seg.type === "key") {
      const access = useNullSafe ? def.nullSafe!.keyAccess : def.keyAccess;
      const escaped = applyEscapes(seg.value, def.escapeRules);
      result += access.template.replace("{value}", escaped);
    } else {
      const access = useNullSafe ? def.nullSafe!.indexAccess : def.indexAccess;
      result += access.template.replace("{value}", String(seg.value));
    }
  }

  return result;
}

/**
 * Convert a path string from one accessor format to another.
 * Parses the old path into segments, preserves the root variable,
 * and re-serializes using the target definition's canonical format.
 */
export function convertPath(
  pathString: string,
  toDef: AccessorDefinition
): string {
  const rootVar = extractRootVar(pathString);
  const segments = parseBracketPath(pathString);

  if (segments.length === 0) return rootVar;

  return serializeFromDefinition(toDef, segments, { rootVar });
}

export function createSerializer(def: AccessorDefinition): Serializer {
  return {
    definition: def,
    serialize(path: PathSegment[], options: Record<string, unknown>): string {
      return serializeFromDefinition(def, path, options);
    },
  };
}
