import type { AccessorDefinition } from "../types";

export const phpArrayDef: AccessorDefinition = {
  id: "php-array",
  label: "Array Access",
  language: "php",
  description: "PHP associative array bracket access",

  keyAccess: { type: "indexer", template: "['{value}']" },
  indexAccess: { type: "indexer", template: "[{value}]" },

  stringQuote: "'",
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: "'", replacement: "\\'" },
  ],

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "$data" },
  ],
};
