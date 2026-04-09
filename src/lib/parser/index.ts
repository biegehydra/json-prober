import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";

export interface ParseResult {
  success: boolean;
  data?: unknown;
  error?: { message: string; offset: number };
}

export function parseJson(input: string): ParseResult {
  if (!input.trim()) {
    return { success: false };
  }

  const errors: ParseError[] = [];
  const data = parse(input, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    return {
      success: false,
      error: {
        message: printParseErrorCode(first.error),
        offset: first.offset,
      },
    };
  }

  if (data === undefined) {
    return { success: false, error: { message: "Empty input", offset: 0 } };
  }

  return { success: true, data };
}
