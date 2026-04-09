import type { AccessorDefinition } from "../types";

export const pythonDictDef: AccessorDefinition = {
  id: "python-dict",
  label: "Dict / List",
  language: "python",
  description: "Python dictionary bracket access",

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
