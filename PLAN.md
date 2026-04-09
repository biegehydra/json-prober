# JSON Path Codegen — Planning Document

## Table of Contents

1. [Market Analysis & Need Assessment](#1-market-analysis--need-assessment)
2. [Existing Python Tool Analysis](#2-existing-python-tool-analysis)
3. [Core Feature Conversion Plan](#3-core-feature-conversion-plan)
4. [Feature Additions & Removals](#4-feature-additions--removals)
5. [Complementary Tools](#5-complementary-tools)
6. [Architecture & Abstractions](#6-architecture--abstractions)
7. [Tech Stack & Project Structure](#7-tech-stack--project-structure)
8. [UI/UX Design](#8-uiux-design)
9. [Open Questions](#9-open-questions)

---

## 1. Market Analysis & Need Assessment

### Existing Tools Surveyed

| Tool | Search by Value | Search by Key | Multi-Language Code Output | Custom Format Templates | Null-Safe Access |
|---|---|---|---|---|---|
| [JSONLint Search](https://jsonlint.com/json-search) | Yes | Yes | No (JSONPath only) | No | No |
| [PathFinder](https://pathfinder.js.org/) | Yes (live filter) | Yes (live filter) | Partial (JS only: optional chaining, lodash, destructuring, JSONPath) | No | JS only |
| [CodelithLabs](https://codelithlabs.in/en/tools/json-path-finder/) | No | No (click-to-path) | No (JSONPath only) | No | No |
| [JSON Utils](https://jsonutils.org/json-path-finder.html) | No | Yes (filter) | No (JSONPath only) | No | No |
| [FindJSONPath](https://www.findjsonpath.com/) | No | No (click-to-path) | Dot + bracket notation | No | No |
| [1000freetools](https://1000freetools.com/json-tools/json-value-search) | Yes | Yes | No (path display only) | No | No |
| **Your Python scripts** | Yes (equality + contains) | Yes (equality + contains + ignore list) | C# Newtonsoft (with null-conditional + escape options) | No | Yes (C# `?[]`) |

### The Gap

Every existing tool falls into one of two camps:

1. **Click-to-path explorers** — You visually navigate a tree and click on a node to get its JSONPath. Useful when you can *see* the value you want but unhelpful when you're searching a 100KB JSON blob for a value you know exists somewhere.

2. **Search tools** — You type a key/value and get results with JSONPath notation. Useful for finding *where* something is, but then you still have to manually translate `$.data.sections[8].hostHighlights[0].title` into whatever accessor syntax your target language/library uses.

**No existing tool combines search-by-key/value with multi-language, library-aware code generation.** PathFinder comes closest but only outputs JavaScript-flavored formats and has no concept of C# Newtonsoft, System.Text.Json, Python dict access, Go, Rust, etc. None of them support configurable output templates.

### Conclusion: There Is a Need

The tool is worth building. The unique value proposition is:

> **"Paste JSON, search for what you need, get copy-paste-ready code in your language."**

The audience is scrapers, API integrators, and backend developers who regularly wrangle unfamiliar JSON payloads — exactly the workflow your Python scripts were built for, but accessible to everyone via a browser.

---

## 2. Existing Python Tool Analysis

### newtonsoft.ipynb — Value Search

**Core functions:**

| Function | Purpose |
|---|---|
| `search_json()` | DFS traversal. Compares leaf values against a target. Supports exact match and case-insensitive contains. Records all matching paths. |
| `to_newtonsoft()` | Serializes a path array (`["data", 0, "title"]`) into a Newtonsoft-style accessor string (`root["data"][0]["title"]`). Options: `safe` (null-conditional `?[]`), `escape_backslashes` (for C# string literals). |
| `print_newtonsoft()` | Takes a Newtonsoft path string, resolves it back against the original JSON, and prints the resolved value. Essentially a path verifier. |
| `traverse()` | Unrelated utility — walks the JSON and reports nodes larger than 20KB. A JSON size profiler. |

**Strengths:**
- Simple, effective DFS search
- Null-conditional operator support (`?[]`) is genuinely useful for C# devs
- Path verification (`print_newtonsoft`) lets you confirm the path is correct
- Backslash escaping for C# string literals is a thoughtful touch

**Weaknesses:**
- Hardcoded to Newtonsoft output only
- `contains` only works on string values (numbers, booleans can't be substring-matched)
- No regex support
- No type-based filtering (e.g., "find all numbers greater than 100")
- File-based input only (no paste, no URL fetch)
- `traverse()` is useful but unrelated to the main tool — belongs in a separate utility

### Untitled2.ipynb — Key Search

**Core functions:**

| Function | Purpose |
|---|---|
| `search_key_json()` | DFS traversal. Compares dict *key names* against a target. Supports exact match and case-insensitive contains. Has an `ignore_keys` set to filter out noisy/common keys. Returns `(path, matched_key, value)` tuples. |
| `to_newtonsoft()` | Same as above (duplicated). |
| `print_newtonsoft()` | Same as above (duplicated). |

**Strengths:**
- Key search is a distinct and valuable mode — when you're looking for lat/lon, you don't know the value, you know the field name
- `ignore_keys` is clever — real-world JSON (especially GraphQL responses) has tons of `__typename`, `id`, etc. that pollute results
- Returns the matched key name alongside the path, which is useful context

**Weaknesses:**
- Same output format limitations as the value search
- `ignore_keys` is hardcoded per run rather than configurable via UI
- No regex support for key matching
- Code is duplicated across both notebooks

---

## 3. Core Feature Conversion Plan

### Search Modes (from Python → TypeScript)

The two notebooks represent two search modes that should be unified into a single search engine:

| Mode | Description | Match Types |
|---|---|---|
| **Value Search** | Searches leaf node values | Equals, Contains, Regex, Starts With, Ends With |
| **Key Search** | Searches dictionary/object key names | Equals, Contains, Regex, Starts With, Ends With |
| **Key+Value Search** *(new)* | Searches both simultaneously | Same as above, independently configurable |

### Match Options (unified across modes)

- **Case sensitivity** toggle (default: insensitive)
- **Match type** selector: Equals / Contains / Starts With / Ends With / Regex
- **Type filter** *(new)*: Only match values of a specific type (string, number, boolean, null, object, array)
- **Ignore keys** list *(from Untitled2)*: Configurable list of key names to skip during traversal
- **Max depth** *(new)*: Limit how deep the search traverses
- **Max results** *(new)*: Cap results to prevent UI overload on huge JSON

### Path Representation (internal)

Internally, a found path should be represented as an array of segments:

```typescript
type PathSegment = { type: "key"; value: string } | { type: "index"; value: number };
type JsonPath = PathSegment[];
```

This is the **neutral intermediate representation** that all serializers consume.

### Path Verification

The `print_newtonsoft()` concept (resolve a path against the JSON and show the value) should be preserved. In the web UI, clicking a result should highlight/expand the node in a tree view and show a preview of the resolved value.

---

## 4. Feature Additions & Removals

### Features to Add

| Feature | Priority | Rationale |
|---|---|---|
| **Multi-language code output** | P0 | The whole point. See [Section 6](#6-architecture--abstractions) for serializer architecture. |
| **Custom format templates** | P0 | Allow users to define their own output format with a template string. |
| **Regex search** | P1 | Power users need it. |
| **JSON input via paste, file upload, URL fetch** | P1 | Replaces the hardcoded `open("my.json")`. |
| **Copy-to-clipboard on each result** | P1 | Essential UX for the primary workflow. |
| **Interactive tree view with search highlighting** | P1 | Visual context for where results live in the structure. |
| **Ignore keys (configurable)** | P1 | Carried over from Untitled2, but as a UI-configurable list. |
| **Value preview in results** | P1 | Show what the matched path resolves to (truncated). |
| **Starts With / Ends With match types** | P2 | Low-cost addition to the match type enum. |
| **Type filter** | P2 | "Show me all paths that lead to a number" is useful. |
| **Max depth / max results** | P2 | Safety valve for huge JSON. |
| **Dark mode** | P2 | Developer tool — dark mode is expected. |
| **Shareable state via URL params** | P3 | Encode settings (not JSON data) in URL for sharing. |
| **JSON formatting/beautification** | P3 | Nice to have but not core. |
| **Keyboard shortcuts** | P3 | Power user feature. |

### Features to Remove / Not Port

| Feature | Rationale |
|---|---|
| `traverse()` size profiler | Unrelated to core search. Could be a separate complementary tool (see Section 5). |
| Hardcoded file I/O | Replaced by paste/upload/URL. |
| `escape_backslashes` as a separate toggle | Should be absorbed into the serializer config — each language preset knows whether it needs escaping. |
| Duplicated code across notebooks | Unified into one search engine. |

---

## 5. Complementary Tools

These are tools that serve the same audience (scrapers, API integrators) and could live on separate pages/tabs within the same project. They're listed in priority order.

| Tool | Description | Why It Complements |
|---|---|---|
| **JSON Size Profiler** | Visualize which parts of a JSON payload are largest. Tree map or sorted list of node sizes. | Evolved from the `traverse()` function. Helps developers understand API response bloat and decide what to extract. |
| **JSON → Type Generator** | Generate TypeScript interfaces, C# classes, Python TypedDicts, Go structs, etc. from a JSON sample. | After finding the path to data you need, you often need to define types for it. |
| **JSON Diff** | Side-by-side comparison of two JSON payloads with structural diff highlighting. | When scraping, API responses change. Diffing helps identify what moved/changed. |
| **JSON Flattener** | Flatten nested JSON into a flat key-value table (and unflatten back). | Useful for importing JSON into spreadsheets or databases. |
| **JSONPath Playground** | Test JSONPath expressions against a JSON payload. | Complementary query approach — some users prefer JSONPath over search. |

> **Recommendation:** Start with just the core **JSON Path Codegen** tool. Add complementary tools in future iterations. The architecture should support adding new tool pages easily (Next.js pages/routes).

---

## 6. Architecture & Abstractions

### Design Principles

1. **Separation of concerns** — Parsing, searching, and serializing are independent layers.
2. **Strategy pattern for serializers** — Adding a new language/library is just adding a new serializer.
3. **Language-agnostic core** — The search engine knows nothing about output languages.
4. **Presets + custom** — Ship with built-in presets for popular languages but always allow custom templates.

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│  (React components, state management, tree view, results)   │
├─────────────────────────────────────────────────────────────┤
│                     Orchestrator                            │
│  (Coordinates parse → search → serialize pipeline)          │
├──────────┬──────────────────────────┬───────────────────────┤
│  Parser  │     Search Engine        │     Serializer        │
│          │                          │     Registry          │
│ parse()  │ search(json, options)    │                       │
│ validate │   → JsonPath[]           │ serialize(path, fmt)  │
│          │                          │   → string            │
├──────────┴──────────────────────────┴───────────────────────┤
│                   Shared Types                              │
│  (PathSegment, JsonPath, SearchOptions, SerializerConfig)   │
└─────────────────────────────────────────────────────────────┘
```

### Parser

Responsible for:
- Accepting raw JSON string input
- Validating JSON syntax
- Returning a parsed JavaScript object
- Reporting parse errors with line/column info

```typescript
interface ParseResult {
  success: boolean;
  data?: unknown;
  error?: { message: string; line: number; column: number };
}

function parseJson(input: string): ParseResult;
```

### Search Engine

Responsible for:
- DFS/BFS traversal of parsed JSON
- Matching logic (value search, key search, combined)
- Respecting filters (type filter, ignore keys, max depth, max results)
- Returning an array of match results

```typescript
interface SearchOptions {
  mode: "value" | "key" | "both";
  query: string;
  matchType: "equals" | "contains" | "startsWith" | "endsWith" | "regex";
  caseSensitive: boolean;
  typeFilter?: ("string" | "number" | "boolean" | "null" | "object" | "array")[];
  ignoreKeys?: string[];
  maxDepth?: number;
  maxResults?: number;
}

interface SearchResult {
  path: PathSegment[];
  matchedOn: "key" | "value";
  matchedKey?: string;       // The key that matched (for key search)
  matchedValue?: unknown;    // The leaf value (for value search) or value at matched key
  resolvedValue?: unknown;   // The value at this path (always populated)
}

function searchJson(data: unknown, options: SearchOptions): SearchResult[];
```

### Serializer Registry

This is the core extensibility point. Each serializer is a **strategy** that knows how to convert a `PathSegment[]` into a code string for a specific language/library combination.

```typescript
interface SerializerConfig {
  id: string;                           // e.g., "csharp-newtonsoft"
  label: string;                        // e.g., "C# (Newtonsoft.Json)"
  language: string;                     // e.g., "csharp" (for syntax highlighting)
  rootExpression: string;               // e.g., "root", "data", "json", "obj"
  options: SerializerOption[];          // Configurable toggles for this serializer
}

interface SerializerOption {
  id: string;                           // e.g., "nullSafe"
  label: string;                        // e.g., "Null-safe access"
  type: "boolean" | "string" | "select";
  default: unknown;
}

interface Serializer {
  config: SerializerConfig;
  serialize(path: PathSegment[], options: Record<string, unknown>): string;
}
```

### Built-in Serializer Presets

| ID | Label | Example Output | Key Options |
|---|---|---|---|
| `csharp-newtonsoft` | C# (Newtonsoft.Json) | `root["data"]["sections"][8]["title"]` | Null-safe (`?[]`), escape backslashes, root variable name |
| `csharp-stj` | C# (System.Text.Json) | `root.GetProperty("data").GetProperty("sections")[8].GetProperty("title")` | Null-safe (try-get pattern), root variable name |
| `javascript-bracket` | JavaScript (bracket) | `data["data"]["sections"][8]["title"]` | Optional chaining (`?.`) |
| `javascript-dot` | JavaScript (dot) | `data.data.sections[8].title` | Optional chaining (`?.`) |
| `javascript-lodash` | JavaScript (lodash get) | `_.get(data, 'data.sections[8].title')` | Default value |
| `python-bracket` | Python (dict) | `data["data"]["sections"][8]["title"]` | `.get()` safe access |
| `python-glom` | Python (glom) | `glom(data, 'data.sections.8.title')` | — |
| `jsonpath` | JSONPath | `$.data.sections[8].title` | — |
| `jmespath` | JMESPath | `data.sections[8].title` | — |
| `ruby` | Ruby (dig) | `data.dig("data", "sections", 8, "title")` | — |
| `go` | Go (gjson) | `gjson.Get(json, "data.sections.8.title")` | — |
| `php` | PHP (array) | `$data['data']['sections'][8]['title']` | Null-safe (`??`) |
| `rust-serde` | Rust (serde_json) | `data["data"]["sections"][8]["title"]` | — |
| `custom` | Custom Template | *(user-defined)* | Template string with placeholders |

### Custom Template System

For the `custom` serializer, users can define their own format using a template DSL:

```
Template: {root}{segments}
Segment (key): ["{key}"]
Segment (index): [{index}]
Separator: (none, or configurable)
Null-safe prefix: ?
```

The idea is that users can compose their own format by specifying:
- **Root expression** — what comes first (e.g., `root`, `data`, `$`)
- **Key segment template** — how to access a string key (e.g., `["{key}"]`, `.{key}`, `.GetProperty("{key}")`)
- **Index segment template** — how to access an array index (e.g., `[{index}]`, `.{index}`)
- **Null-safe key template** — alternate template when null-safety is on (e.g., `?["{key}"]`, `?.{key}`)
- **Null-safe index template** — same for indices (e.g., `?.[{index}]`)
- **String escaping rules** — how to handle special chars in keys (e.g., double quotes, backslashes)

This could be expressed as a simple config object:

```typescript
interface CustomTemplateConfig {
  rootExpression: string;
  keySegment: string;         // e.g., '["{key}"]' or '.{key}' or '.GetProperty("{key}")'
  indexSegment: string;       // e.g., '[{index}]'
  nullSafeKeySegment?: string;
  nullSafeIndexSegment?: string;
  escapeRules?: {
    char: string;
    replacement: string;
  }[];
}
```

---

## 7. Tech Stack & Project Structure

### Tech Stack

- **Framework:** Next.js (already in the repo)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (already configured)
- **State management:** React state + context (no need for Redux — this is a single-page tool)
- **JSON tree view:** A virtual-scrolling tree component (react-arborist, or custom) for large JSON
- **Code highlighting:** Prism.js or Shiki for syntax-highlighted output
- **Testing:** Vitest for unit tests on the search engine and serializers

### Proposed Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Main tool page
│   ├── layout.tsx                        # App layout with nav
│   └── json-profiler/                    # Future: complementary tool
│       └── page.tsx
├── components/
│   ├── json-input/                       # JSON input panel (paste, upload, URL)
│   │   ├── JsonInputPanel.tsx
│   │   ├── FileUpload.tsx
│   │   └── UrlFetch.tsx
│   ├── search/                           # Search controls
│   │   ├── SearchPanel.tsx
│   │   ├── SearchModeSelector.tsx
│   │   ├── MatchTypeSelector.tsx
│   │   └── IgnoreKeysInput.tsx
│   ├── results/                          # Search results display
│   │   ├── ResultsPanel.tsx
│   │   ├── ResultCard.tsx
│   │   └── ValuePreview.tsx
│   ├── serializer/                       # Output format selection
│   │   ├── SerializerPanel.tsx
│   │   ├── PresetSelector.tsx
│   │   ├── SerializerOptions.tsx
│   │   └── CustomTemplateEditor.tsx
│   ├── tree-view/                        # JSON tree visualization
│   │   ├── JsonTreeView.tsx
│   │   └── TreeNode.tsx
│   └── shared/                           # Shared UI components
│       ├── CopyButton.tsx
│       ├── CodeBlock.tsx
│       └── ThemeToggle.tsx
├── lib/
│   ├── parser/
│   │   └── index.ts                      # JSON parsing + validation
│   ├── search/
│   │   ├── engine.ts                     # Core search algorithm
│   │   ├── matchers.ts                   # Match logic (equals, contains, regex, etc.)
│   │   └── types.ts                      # SearchOptions, SearchResult, etc.
│   ├── serializers/
│   │   ├── registry.ts                   # Serializer registry (register, get, list)
│   │   ├── types.ts                      # Serializer, SerializerConfig, etc.
│   │   ├── custom-template.ts            # Custom template engine
│   │   └── presets/
│   │       ├── csharp-newtonsoft.ts
│   │       ├── csharp-stj.ts
│   │       ├── javascript-bracket.ts
│   │       ├── javascript-dot.ts
│   │       ├── javascript-lodash.ts
│   │       ├── python-bracket.ts
│   │       ├── jsonpath.ts
│   │       ├── jmespath.ts
│   │       ├── ruby-dig.ts
│   │       ├── go-gjson.ts
│   │       ├── php-array.ts
│   │       ├── rust-serde.ts
│   │       └── index.ts                  # Exports all presets
│   └── types.ts                          # Shared types (PathSegment, JsonPath)
└── __tests__/
    ├── search/
    │   └── engine.test.ts
    ├── serializers/
    │   ├── csharp-newtonsoft.test.ts
    │   ├── javascript.test.ts
    │   └── custom-template.test.ts
    └── parser/
        └── index.test.ts
```

---

## 8. UI/UX Design

### Layout

Three-panel layout (responsive):

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header: JSON Path Codegen — [Tool Name TBD]            [Dark Mode] │
├──────────────────────────┬───────────────────────────────────────────┤
│                          │                                           │
│   JSON Input Panel       │   Search & Results Panel                  │
│                          │                                           │
│   ┌──────────────────┐   │   ┌─────────────────────────────────┐     │
│   │ Paste / Upload /  │   │   │ Search: [_______________] [Go]  │     │
│   │ Fetch URL         │   │   │ Mode: ○ Value ○ Key ○ Both      │     │
│   │                   │   │   │ Match: [Contains ▾] □ Case Sens │     │
│   │ [JSON editor with │   │   │ Ignore: [tag chips...]          │     │
│   │  syntax highlight │   │   ├─────────────────────────────────┤     │
│   │  and line numbers]│   │   │ Output Format: [Preset ▾]       │     │
│   │                   │   │   │ ☑ Null-safe  Root: [root]       │     │
│   │                   │   │   │ [Custom Template...]            │     │
│   │                   │   │   ├─────────────────────────────────┤     │
│   │                   │   │   │ Results (3 found):              │     │
│   │                   │   │   │                                 │     │
│   │                   │   │   │ ┌─ Result 1 ──────────── [📋]─┐ │     │
│   │                   │   │   │ │ root?["data"]?["sections"]  │ │     │
│   │                   │   │   │ │ ?[8]?["title"]              │ │     │
│   │                   │   │   │ │ Value: "Stark Company..."   │ │     │
│   │                   │   │   │ └─────────────────────────────┘ │     │
│   │                   │   │   │                                 │     │
│   │                   │   │   │ ┌─ Result 2 ──────────── [📋]─┐ │     │
│   │                   │   │   │ │ ...                          │ │     │
│   │                   │   │   │ └─────────────────────────────┘ │     │
│   └──────────────────┘   │   └─────────────────────────────────┘     │
│                          │                                           │
├──────────────────────────┴───────────────────────────────────────────┤
│  Optional: Collapsible JSON Tree View (with highlighted matches)     │
└──────────────────────────────────────────────────────────────────────┘
```

### Key UX Decisions

1. **Search is the primary action.** The search bar should be prominent and the output format selector should be visible but secondary. Users should be able to paste JSON, type a search term, and get results in 2 clicks.

2. **Live results vs. button click.** For small-to-medium JSON (<1MB), results should update live as you type. For large JSON (>1MB), require a button click to avoid UI lag. The threshold should be configurable or auto-detected.

3. **Copy is king.** Every result should have a one-click copy button. There should also be a "Copy All" button that copies all results (one per line).

4. **Output format persists.** The selected output format and its options should be stored in localStorage so returning users don't have to reconfigure.

5. **JSON tree view is supplementary.** It should be collapsible/expandable and not required for the core workflow. When a result is clicked, the tree should scroll to and highlight that node.

6. **Mobile-responsive.** Panels should stack vertically on small screens. The tool should be usable on mobile for quick lookups.

---

## 9. Open Questions

> **Instructions:** Edit the answers inline, then we'll build from this plan.

### Product & Scope

**Q1: What should the tool be called?**
Options to consider:
- JSON Path Codegen
- JSON Accessor Generator
- PathForge
- JSONdig
- Something else?

**Answer:** JSONdig

---

**Q2: Should complementary tools (JSON profiler, type generator, etc.) be planned into the initial build, or should we start with just the core search tool?**

My recommendation is to build only the core tool first but structure the project so adding tool pages later is trivial (Next.js routes).

**Answer:** Start with just core tool

---

**Q3: Do you want the JSON tree view in the initial build, or is it a "nice to have" for later?**

The tree view adds significant complexity (virtualized rendering for large JSON). A simpler "value preview" panel for each result might be sufficient for v1.

**Answer:** Really just a nice to have, but syntax highlighting is a must

---

### Output & Serializers

**Q4: Which serializer presets should ship in v1?**

My recommended v1 set (covering the most common languages):
- C# — Newtonsoft.Json
- C# — System.Text.Json
- JavaScript — dot notation (with optional chaining)
- JavaScript — bracket notation (with optional chaining)
- JavaScript — lodash `_.get()`
- Python — bracket/dict access (with `.get()` safe variant)
- JSONPath
- Custom template

Full list for later: JMESPath, Ruby dig, Go gjson, PHP, Rust serde_json, etc.

Should we ship all of these in v1 or start with a smaller set?

**Answer:** The first 2 C# ones

---

**Q5: For the custom template system, how advanced should it be?**

Options:
- **Simple:** A few text fields (root expression, key template, index template, null-safe variants). Easy to use but limited.
- **Advanced:** A mini template language with variables like `{key}`, `{index}`, `{depth}`, `{isLast}`, conditionals, etc. Powerful but harder to learn.
- **Both:** Simple mode by default with an "advanced" toggle.

**Answer:** Simple but don't create in V1

---

**Q6: Should serializers support generating *multi-line* code snippets?**

For example, System.Text.Json in C# might benefit from generating a full try-get pattern:

```csharp
if (root.TryGetProperty("data", out var data) &&
    data.TryGetProperty("sections", out var sections) &&
    sections[8].TryGetProperty("title", out var title))
{
    // use title
}
```

This is significantly more complex than single-line accessors but much more useful for languages with verbose null-safety patterns.

**Answer:** Ignore for v1

---

### Search Features

**Q7: Should search support numeric comparisons?**

For example: "find all values greater than 100" or "find all values between -90 and 90" (useful for finding lat/lon by range). This adds complexity to the search options UI but could be very powerful.

**Answer:** Yes

---

**Q8: How should array results be handled?**

When a match is inside an array, the path includes a specific index (e.g., `sections[8]`). Should the tool also offer a "wildcard" variant (e.g., `sections[*]` or `sections[i]`) for when the user wants to iterate all items?

**Answer:** No wildcard needed, include specific index

---

**Q9: Should the tool support multiple simultaneous searches?**

For example: "find paths where key contains 'lat' OR key contains 'lon'" in a single operation. This could be useful for finding related fields.

**Answer:** For V1 just a single value

---

### Technical

**Q10: Should JSON input support JSON with comments (JSONC) or JSON5?**

Real-world config files often use JSONC (JSON with comments). Supporting it would broaden the audience.

**Answer:** Yes support json with comments

---

**Q11: Should there be a "permalink" feature where the current JSON + search + settings are encoded in the URL for sharing?**

Note: This could be a privacy concern if JSON contains sensitive data. One option is to encode only the settings (search term, format, options) in the URL but not the JSON data itself.

**Answer:** Not needed in V1

---

**Q12: Any preferences on the JSON editor component?**

Options:
- **CodeMirror 6** — Full-featured, well-maintained, supports large files, syntax highlighting, line numbers, folding. Heavier.
- **Monaco Editor** — VS Code's editor. Very powerful but large bundle size.
- **Simple textarea with syntax highlighting** — Lightweight but no folding/line numbers.
- **@uiw/react-textarea-code-editor** — Lightweight code editor component.

My recommendation: CodeMirror 6 for the best balance of features and bundle size.

**Answer:** I'm not familiar, you pick but I want one that works well with react

---

**Q13: Do you have a deployment target in mind?**

Options: Vercel (natural for Next.js), Cloudflare Pages, Netlify, GitHub Pages (static export), self-hosted.

**Answer:** Vercel. Ideally a static next.js app though that can just use export/output

---

**Q14: Should there be any analytics?**

Since the tool runs entirely client-side and handles potentially sensitive JSON data, analytics should be minimal or none. But basic anonymous usage stats (e.g., which serializers are most popular) could help prioritize future presets.

**Answer:** Not part of v1

---

## Summary of Architecture Decisions (Pending Your Input)

| Decision | Current Recommendation | Status |
|---|---|---|
| Separation of Parser / Search / Serializer | Yes — clean boundaries | Decided |
| Strategy pattern for serializers | Yes — registry-based | Decided |
| Internal path representation | `PathSegment[]` | Decided |
| Custom template system | Simple mode with potential advanced toggle | Awaiting Q5 |
| Multi-line code generation | Support but defer to v2 | Awaiting Q6 |
| JSON tree view | Defer to v2 | Awaiting Q3 |
| Complementary tools | Defer, but structure project for them | Awaiting Q2 |
| v1 serializer set | 8 presets + custom | Awaiting Q4 |
| Client-side only | Yes — no server, no data leaves the browser | Decided |

---

*This document should be edited with your answers and any additional requirements before implementation begins.*
