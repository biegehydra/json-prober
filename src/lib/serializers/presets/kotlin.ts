import type { AccessorDefinition } from "../types";

export const kotlinMapDef: AccessorDefinition = {
  id: "kotlin-map",
  label: "Map / List",
  language: "kotlin",
  description: "Kotlin map and list bracket access",

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
