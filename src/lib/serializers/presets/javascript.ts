import type { AccessorDefinition } from "../types";

export const jsBracketDef: AccessorDefinition = {
  id: "js-bracket",
  label: "Bracket Notation",
  language: "javascript",
  description: "JavaScript / TypeScript bracket accessor with optional chaining",

  keyAccess: { type: "indexer", template: '["{value}"]' },
  indexAccess: { type: "indexer", template: "[{value}]" },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  nullSafe: {
    keyAccess: { type: "indexer", template: '?.["{value}"]' },
    indexAccess: { type: "indexer", template: "?.[{value}]" },
  },

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "data" },
    {
      id: "nullSafe",
      label: "Optional chaining (?.)",
      type: "boolean",
      default: false,
    },
  ],
};
