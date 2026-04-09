import type { AccessorDefinition } from "../types";

export const goMapDef: AccessorDefinition = {
  id: "go-map",
  label: "Map / Slice",
  language: "go",
  description: "Go map[string]interface{} bracket access",

  keyAccess: { type: "indexer", template: '["{value}"]' },
  indexAccess: { type: "indexer", template: "[{value}]" },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "data" },
  ],
};
