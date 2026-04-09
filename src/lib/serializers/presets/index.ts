import { registerSerializer } from "../registry";
import { createSerializer } from "../serialize";
import { csharpNewtonsoftDef } from "./csharp-newtonsoft";
import { csharpStjDef } from "./csharp-stj";
import { pythonDictDef } from "./python";
import { jsBracketDef } from "./javascript";
import { javaJacksonDef } from "./java";
import { goMapDef } from "./go";
import { rubyHashDef } from "./ruby";
import { phpArrayDef } from "./php";
import { kotlinMapDef } from "./kotlin";
import { swiftSwiftyJsonDef } from "./swift";
import { rustSerdeDef } from "./rust";
import { dotPascalDef, dotCamelDef, dotSnakeDef } from "./dot-notation";

const ALL_DEFINITIONS = [
  csharpNewtonsoftDef,
  csharpStjDef,
  dotPascalDef,
  dotCamelDef,
  dotSnakeDef,
  goMapDef,
  javaJacksonDef,
  jsBracketDef,
  kotlinMapDef,
  phpArrayDef,
  pythonDictDef,
  rubyHashDef,
  rustSerdeDef,
  swiftSwiftyJsonDef,
];

let registered = false;

export function registerAllPresets(): void {
  if (registered) return;
  registered = true;
  for (const def of ALL_DEFINITIONS) {
    registerSerializer(createSerializer(def));
  }
}
