import type { PathSegment } from "../types";
import { parseBracketPath, extractRootVar, reconcileSegments } from "../path-resolver";
import type { AccessorDefinition, KeyAccess, Serializer } from "./types";
import { transformKey } from "../case-transforms";

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

function applyKeyAccess(
  access: KeyAccess,
  key: string,
  escapeRules: { char: string; replacement: string }[]
): string {
  if (access.type === "property") {
    return access.separator + transformKey(key, access);
  }
  const escaped = applyEscapes(key, escapeRules);
  return access.template.replace("{value}", escaped);
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
      result += applyKeyAccess(access, seg.value, def.escapeRules);
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
 *
 * When the source definition uses property access and jsonData is provided,
 * reconciles case-transformed keys back to original JSON keys first.
 */
export function convertPath(
  pathString: string,
  toDef: AccessorDefinition,
  jsonData?: unknown,
  fromDef?: AccessorDefinition
): string {
  const rootVar = extractRootVar(pathString);
  let segments = parseBracketPath(pathString);

  if (segments.length === 0) return rootVar;

  if (
    jsonData !== undefined &&
    fromDef?.keyAccess.type === "property"
  ) {
    const reconciled = reconcileSegments(segments, jsonData, fromDef.keyAccess);
    segments = reconciled.segments;
  }

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
