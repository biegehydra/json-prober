import type { PathSegment } from "../types";

export interface CustomTemplateConfig {
  rootExpression: string;
  keySegment: string;
  indexSegment: string;
  nullSafeKeySegment?: string;
  nullSafeIndexSegment?: string;
  escapeRules?: { char: string; replacement: string }[];
}

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

export function serializeWithTemplate(
  path: PathSegment[],
  config: CustomTemplateConfig,
  nullSafe: boolean
): string {
  let result = config.rootExpression;

  for (const seg of path) {
    if (seg.type === "key") {
      const escaped = config.escapeRules
        ? applyEscapes(seg.value, config.escapeRules)
        : seg.value;

      const template =
        nullSafe && config.nullSafeKeySegment
          ? config.nullSafeKeySegment
          : config.keySegment;

      result += template.replace("{key}", escaped);
    } else {
      const template =
        nullSafe && config.nullSafeIndexSegment
          ? config.nullSafeIndexSegment
          : config.indexSegment;

      result += template.replace("{index}", String(seg.value));
    }
  }

  return result;
}
