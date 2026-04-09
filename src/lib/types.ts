export type PathSegment =
  | { type: "key"; value: string }
  | { type: "index"; value: number };

export type JsonPath = PathSegment[];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];
