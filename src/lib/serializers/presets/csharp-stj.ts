import type { Serializer } from "../types";
import type { PathSegment } from "../../types";

export const csharpStjSerializer: Serializer = {
  config: {
    id: "csharp-stj",
    label: "C# (System.Text.Json)",
    language: "csharp",
    description: "JsonElement accessor syntax for System.Text.Json",
    options: [
      {
        id: "rootVar",
        label: "Root variable",
        type: "string",
        default: "root",
      },
      {
        id: "nullSafe",
        label: "Use TryGetProperty pattern",
        type: "boolean",
        default: false,
      },
    ],
  },

  serialize(path: PathSegment[], options: Record<string, unknown>): string {
    const rootVar = (options.rootVar as string) || "root";
    const nullSafe = options.nullSafe === true;

    if (path.length === 0) return rootVar;

    const parts: string[] = [rootVar];

    for (const seg of path) {
      if (seg.type === "key") {
        const escaped = seg.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        if (nullSafe) {
          parts.push(`.TryGetProperty("${escaped}", out var _)`);
        } else {
          parts.push(`.GetProperty("${escaped}")`);
        }
      } else {
        parts.push(`[${seg.value}]`);
      }
    }

    return parts.join("");
  },
};
