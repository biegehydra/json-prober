import type { AccessorDefinition } from "../types";

export const rustSerdeDef: AccessorDefinition = {
  id: "rust-serde",
  label: "serde_json",
  language: "rust",
  description: "serde_json::Value index access for Rust",

  keyAccess: { type: "indexer", template: '["{value}"]' },
  indexAccess: { type: "indexer", template: "[{value}]" },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "value" },
  ],
};
