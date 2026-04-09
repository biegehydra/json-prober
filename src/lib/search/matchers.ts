import type { MatchType, NumericComparison } from "./types";

export function matchText(
  candidate: string,
  query: string,
  matchType: MatchType,
  caseSensitive: boolean
): boolean {
  const a = caseSensitive ? candidate : candidate.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();

  switch (matchType) {
    case "equals":
      return a === q;
    case "contains":
      return a.includes(q);
    case "startsWith":
      return a.startsWith(q);
    case "endsWith":
      return a.endsWith(q);
    case "regex": {
      try {
        const flags = caseSensitive ? "" : "i";
        return new RegExp(query, flags).test(candidate);
      } catch {
        return false;
      }
    }
  }
}

export function matchNumeric(
  value: number,
  comparison: NumericComparison,
  target: number,
  targetEnd?: number
): boolean {
  switch (comparison) {
    case "eq":
      return value === target;
    case "gt":
      return value > target;
    case "gte":
      return value >= target;
    case "lt":
      return value < target;
    case "lte":
      return value <= target;
    case "between":
      return (
        targetEnd !== undefined && value >= target && value <= targetEnd
      );
  }
}
