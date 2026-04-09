import type { AccessorDefinition } from "../types";

export const dotPascalDef: AccessorDefinition = {
  id: "dot-pascal",
  label: "Property (PascalCase)",
  language: "generic",
  description: "Dot-notation property access with PascalCase naming (e.g. root.FirstName)",

  keyAccess: {
    type: "property",
    separator: ".",
    caseTransform: "PascalCase",
    invalidCharReplacement: "_",
  },
  indexAccess: {
    type: "indexer",
    template: "[{value}]",
  },

  stringQuote: '"',
  escapeRules: [],

  options: [
    {
      id: "rootVar",
      label: "Root variable",
      type: "string",
      default: "root",
    },
  ],
};

export const dotCamelDef: AccessorDefinition = {
  id: "dot-camel",
  label: "Property (camelCase)",
  language: "generic",
  description: "Dot-notation property access with camelCase naming (e.g. root.firstName)",

  keyAccess: {
    type: "property",
    separator: ".",
    caseTransform: "camelCase",
    invalidCharReplacement: "_",
  },
  indexAccess: {
    type: "indexer",
    template: "[{value}]",
  },

  stringQuote: '"',
  escapeRules: [],

  options: [
    {
      id: "rootVar",
      label: "Root variable",
      type: "string",
      default: "root",
    },
  ],
};

export const dotSnakeDef: AccessorDefinition = {
  id: "dot-snake",
  label: "Property (snake_case)",
  language: "generic",
  description: "Dot-notation property access with snake_case naming (e.g. root.first_name)",

  keyAccess: {
    type: "property",
    separator: ".",
    caseTransform: "snake_case",
    invalidCharReplacement: "_",
  },
  indexAccess: {
    type: "indexer",
    template: "[{value}]",
  },

  stringQuote: '"',
  escapeRules: [],

  options: [
    {
      id: "rootVar",
      label: "Root variable",
      type: "string",
      default: "root",
    },
  ],
};
