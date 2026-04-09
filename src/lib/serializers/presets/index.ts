import { registerSerializer } from "../registry";
import { csharpNewtonsoftSerializer } from "./csharp-newtonsoft";
import { csharpStjSerializer } from "./csharp-stj";

export function registerAllPresets(): void {
  registerSerializer(csharpNewtonsoftSerializer);
  registerSerializer(csharpStjSerializer);
}
