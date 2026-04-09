import type { AccessorDefinition } from "../types";

export const csharpNewtonsoftDef: AccessorDefinition = {
  id: "csharp-newtonsoft",
  label: "C# (Newtonsoft.Json)",
  language: "csharp",
  description: "JToken bracket accessor syntax for Newtonsoft.Json",

  keyAccess: {
    type: "indexer",
    template: '["{value}"]',
  },
  indexAccess: {
    type: "indexer",
    template: "[{value}]",
  },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  nullSafe: {
    keyAccess: {
      type: "indexer",
      template: '?["{value}"]',
    },
    indexAccess: {
      type: "indexer",
      template: "?[{value}]",
    },
  },

  options: [
    {
      id: "rootVar",
      label: "Root variable",
      type: "string",
      default: "root",
    },
    {
      id: "nullSafe",
      label: "Null-conditional (?[])",
      type: "boolean",
      default: true,
    },
  ],
};
