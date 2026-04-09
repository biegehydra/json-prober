import type { AccessorDefinition } from "../types";

export const rubyHashDef: AccessorDefinition = {
  id: "ruby-hash",
  label: "Hash / Array",
  language: "ruby",
  description: "Ruby hash and array bracket access",

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
