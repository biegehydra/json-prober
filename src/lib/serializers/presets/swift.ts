import type { AccessorDefinition } from "../types";

export const swiftSwiftyJsonDef: AccessorDefinition = {
  id: "swift-swiftyjson",
  label: "SwiftyJSON",
  language: "swift",
  description: "SwiftyJSON subscript access for Swift",

  keyAccess: { type: "indexer", template: '["{value}"]' },
  indexAccess: { type: "indexer", template: "[{value}]" },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "json" },
  ],
};
