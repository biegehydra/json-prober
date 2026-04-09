export const LANGUAGE_DISPLAY: Record<string, string> = {
  csharp: "C#",
  python: "Python",
  javascript: "JS / TS",
  java: "Java",
  go: "Go",
  ruby: "Ruby",
  php: "PHP",
  kotlin: "Kotlin",
  swift: "Swift",
  rust: "Rust",
};

export const LANGUAGE_COLORS: Record<string, { bg: string; text: string }> = {
  csharp:     { bg: "rgba(104, 33, 164, 0.2)",  text: "#b484e0" },  // purple
  python:     { bg: "rgba(55, 118, 171, 0.2)",   text: "#6bb8e8" },  // blue
  javascript: { bg: "rgba(212, 177, 37, 0.2)",   text: "#e8d44d" },  // yellow
  java:       { bg: "rgba(207, 97, 42, 0.2)",    text: "#e8934d" },  // orange
  go:         { bg: "rgba(0, 173, 216, 0.2)",     text: "#4dd5f0" },  // cyan
  ruby:       { bg: "rgba(200, 37, 46, 0.2)",    text: "#e85c63" },  // red
  php:        { bg: "rgba(119, 123, 180, 0.2)",   text: "#a3a6d4" },  // lavender
  kotlin:     { bg: "rgba(169, 101, 232, 0.2)",   text: "#c48ef0" },  // violet
  swift:      { bg: "rgba(240, 81, 56, 0.2)",    text: "#f07860" },  // orange-red
  rust:       { bg: "rgba(222, 165, 100, 0.2)",   text: "#dea564" },  // rust/amber
};

export function getLanguageLabel(code: string): string {
  return LANGUAGE_DISPLAY[code] ?? code;
}

export function getLanguageColor(code: string): { bg: string; text: string } {
  return LANGUAGE_COLORS[code] ?? { bg: "rgba(130, 130, 130, 0.2)", text: "#aaa" };
}
