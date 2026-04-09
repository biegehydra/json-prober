import { registerSerializer } from "../registry";
import { createSerializer } from "../serialize";
import { csharpNewtonsoftDef } from "./csharp-newtonsoft";
import { csharpStjDef } from "./csharp-stj";

export function registerAllPresets(): void {
  registerSerializer(createSerializer(csharpNewtonsoftDef));
  registerSerializer(createSerializer(csharpStjDef));
}
