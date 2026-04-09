import type { Serializer } from "../types";
import type { PathSegment } from "../../types";
import {
  serializeWithTemplate,
  type CustomTemplateConfig,
} from "../custom-template";

const config: CustomTemplateConfig = {
  rootExpression: "",
  keySegment: '["{key}"]',
  indexSegment: "[{index}]",
  nullSafeKeySegment: '?["{key}"]',
  nullSafeIndexSegment: "?[{index}]",
  escapeRules: [
    { char: "\\", replacement: "\\\\" },
    { char: '"', replacement: '\\"' },
  ],
};

export const csharpNewtonsoftSerializer: Serializer = {
  config: {
    id: "csharp-newtonsoft",
    label: "C# (Newtonsoft.Json)",
    language: "csharp",
    description: "JToken bracket accessor syntax for Newtonsoft.Json",
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
      {
        id: "escapeBackslashes",
        label: "Escape backslashes (for string literals)",
        type: "boolean",
        default: false,
      },
    ],
  },

  serialize(path: PathSegment[], options: Record<string, unknown>): string {
    const rootVar = (options.rootVar as string) || "root";
    const nullSafe = options.nullSafe !== false;
    const escapeBackslashes = options.escapeBackslashes === true;

    const templateConfig: CustomTemplateConfig = {
      ...config,
      rootExpression: rootVar,
      escapeRules: escapeBackslashes
        ? [
            { char: '"', replacement: '\\"' },
            { char: "\\", replacement: "\\\\" },
          ]
        : [{ char: '"', replacement: '\\"' }],
    };

    return serializeWithTemplate(path, templateConfig, nullSafe);
  },
};
