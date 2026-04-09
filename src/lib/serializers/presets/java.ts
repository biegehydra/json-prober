import type { AccessorDefinition } from "../types";

export const javaJacksonDef: AccessorDefinition = {
  id: "java-jackson",
  label: "Jackson / Gson",
  language: "java",
  description: "JsonNode.get() accessor for Jackson and Gson",

  keyAccess: {
    type: "method",
    methodName: "get",
    template: '.get("{value}")',
  },
  indexAccess: { type: "indexer", template: ".get({value})" },

  stringQuote: '"',
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],

  options: [
    { id: "rootVar", label: "Root variable", type: "string", default: "node" },
  ],
};
