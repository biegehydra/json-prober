import type { PathSegment } from "../types";

export interface SerializerOption {
  id: string;
  label: string;
  type: "boolean" | "string";
  default: unknown;
}

export interface SerializerConfig {
  id: string;
  label: string;
  language: string;
  description: string;
  options: SerializerOption[];
}

export interface Serializer {
  config: SerializerConfig;
  serialize(
    path: PathSegment[],
    options: Record<string, unknown>
  ): string;
}
