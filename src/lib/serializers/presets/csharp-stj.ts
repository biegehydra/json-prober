import type { AccessorDefinition } from "../types";

export const csharpStjDef: AccessorDefinition = {
  id: "csharp-stj",
  label: "C# (System.Text.Json)",
  language: "csharp",
  description: "JsonElement accessor syntax for System.Text.Json",

  keyAccess: {
    type: "method",
    methodName: "GetProperty",
    template: '.GetProperty("{value}")',
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

  options: [
    {
      id: "rootVar",
      label: "Root variable",
      type: "string",
      default: "root",
    },
  ],
};
