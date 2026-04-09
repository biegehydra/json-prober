"use client";

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { parseBracketPath, resolvePathSegments } from "@/lib/path-resolver";
import { CopyButton } from "./CopyButton";
import type { AccessorDefinition } from "@/lib/serializers/types";

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  jsonData: unknown;
  placeholder?: string;
  accessorDef?: AccessorDefinition;
}

// --- Delimiter extraction from AccessorDefinition ---

interface StringDelimiter {
  open: string;
  close: string;
}

function extractDelimitersFromTemplate(template: string): StringDelimiter {
  const idx = template.indexOf("{value}");
  return {
    open: template.substring(0, idx),
    close: template.substring(idx + "{value}".length),
  };
}

function getStringDelimiters(def: AccessorDefinition): StringDelimiter[] {
  const delims: StringDelimiter[] = [];
  delims.push(extractDelimitersFromTemplate(def.keyAccess.template));
  if (def.nullSafe) {
    delims.push(extractDelimitersFromTemplate(def.nullSafe.keyAccess.template));
  }
  return delims;
}

function getKeyInsertDelimiters(def: AccessorDefinition): StringDelimiter {
  return extractDelimitersFromTemplate(def.keyAccess.template);
}

// --- Open accessor detection ---

interface OpenStringAccessor {
  type: "string";
  completedPath: string;
  partialKey: string;
  openDelimiter: string;
  closeDelimiter: string;
}

interface OpenIndexAccessor {
  type: "index";
  completedPath: string;
  partialIndex: string;
}

interface OpenMethodAccessor {
  type: "method";
  completedPath: string;
  partialMethod: string;
  dotPos: number;
}

type OpenAccessor = OpenStringAccessor | OpenIndexAccessor | OpenMethodAccessor;

function detectOpenAccessor(
  input: string,
  def: AccessorDefinition | undefined
): OpenAccessor | null {
  const stringDelims = def ? getStringDelimiters(def) : [{ open: '["', close: '"]' }];

  // 1. Check for open string accessor
  let bestStringPos = -1;
  let bestString: OpenStringAccessor | null = null;

  for (const { open, close } of stringDelims) {
    let searchFrom = input.length;
    while (searchFrom > 0) {
      const pos = input.lastIndexOf(open, searchFrom - 1);
      if (pos === -1) break;

      const afterOpen = input.substring(pos + open.length);
      if (!afterOpen.includes(close)) {
        if (pos > bestStringPos) {
          bestStringPos = pos;
          bestString = {
            type: "string",
            completedPath: input.substring(0, pos),
            partialKey: afterOpen,
            openDelimiter: open,
            closeDelimiter: close,
          };
        }
        break;
      }
      searchFrom = pos;
    }
  }

  // 2. Check for open bare bracket (index accessor)
  let bestIndexPos = -1;
  let bestIndex: OpenIndexAccessor | null = null;

  const quote = def?.stringQuote ?? '"';
  let idxSearch = input.length;
  while (idxSearch > 0) {
    const pos = input.lastIndexOf("[", idxSearch - 1);
    if (pos === -1) break;

    const charAfterBracket = input[pos + 1];
    if (charAfterBracket === quote) {
      idxSearch = pos;
      continue;
    }

    const afterBracket = input.substring(pos + 1);
    if (!afterBracket.includes("]")) {
      if (pos > bestIndexPos) {
        bestIndexPos = pos;
        bestIndex = {
          type: "index",
          completedPath: input.substring(0, pos),
          partialIndex: afterBracket.replace(/\?/g, ""),
        };
      }
      break;
    }
    idxSearch = pos;
  }

  // 3. Check for dot-method accessor (only if keyAccess is method-based)
  let bestMethodPos = -1;
  let bestMethod: OpenMethodAccessor | null = null;

  if (def?.keyAccess.type === "method") {
    const dotPos = input.lastIndexOf(".");
    if (dotPos !== -1) {
      const afterDot = input.substring(dotPos + 1);
      if (!afterDot.includes("(") && !afterDot.includes("[")) {
        const partial = afterDot.toLowerCase();
        const methodName = def.keyAccess.methodName;
        if (methodName.toLowerCase().startsWith(partial) || afterDot === "") {
          bestMethodPos = dotPos;
          bestMethod = {
            type: "method",
            completedPath: input.substring(0, dotPos),
            partialMethod: afterDot,
            dotPos,
          };
        }
      }
    }
  }

  // Return whichever is latest in the string
  const candidates: [number, OpenAccessor][] = [];
  if (bestString) candidates.push([bestStringPos, bestString]);
  if (bestIndex) candidates.push([bestIndexPos, bestIndex]);
  if (bestMethod) candidates.push([bestMethodPos, bestMethod]);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b[0] - a[0]);
  return candidates[0][1];
}

function escapeKeyForDelimiter(
  key: string,
  rules: { char: string; replacement: string }[]
): string {
  let escaped = key;
  for (const rule of rules) {
    escaped = escaped.replaceAll(rule.char, rule.replacement);
  }
  return escaped;
}

interface SuggestionItem {
  label: string;
  insertValue: string;
  detail?: string;
  wrapOpen?: string;
  wrapClose?: string;
  rawInsert?: string;
}

export function PathInput({
  value,
  onChange,
  jsonData,
  placeholder,
  accessorDef,
}: PathInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const accessor = useMemo(() => {
    if (dismissed) return null;
    return detectOpenAccessor(value, accessorDef);
  }, [value, dismissed, accessorDef]);

  const { suggestions, header } = useMemo((): {
    suggestions: SuggestionItem[];
    header: ReactNode;
  } => {
    if (!accessor || jsonData === undefined)
      return { suggestions: [], header: null };

    const segments = parseBracketPath(accessor.completedPath);
    const resolved = resolvePathSegments(jsonData, segments);

    if (resolved.error || resolved.value === null || resolved.value === undefined) {
      return { suggestions: [], header: null };
    }

    const escapeRules = accessorDef?.escapeRules ?? [
      { char: "\\", replacement: "\\\\" },
      { char: '"', replacement: '\\"' },
    ];

    // --- Method accessor: suggest the method name ---
    if (accessor.type === "method") {
      if (typeof resolved.value !== "object") {
        return { suggestions: [], header: null };
      }

      const methodName = accessorDef?.keyAccess.type === "method"
        ? accessorDef.keyAccess.methodName
        : "";
      const partial = accessor.partialMethod.toLowerCase();

      if (!methodName.toLowerCase().startsWith(partial)) {
        return { suggestions: [], header: null };
      }

      const { open } = getKeyInsertDelimiters(accessorDef!);

      return {
        suggestions: [
          {
            label: `${methodName}(…)`,
            insertValue: methodName,
            detail: Array.isArray(resolved.value)
              ? `navigate array (${(resolved.value as unknown[]).length} items)`
              : "navigate into key",
            rawInsert: open.startsWith(".")
              ? open
              : `.${methodName}${accessorDef!.stringQuote}`,
          },
        ],
        header: null,
      };
    }

    // --- String accessor: suggest object keys ---
    if (accessor.type === "string") {
      if (typeof resolved.value !== "object" || Array.isArray(resolved.value)) {
        return { suggestions: [], header: null };
      }

      const keys = Object.keys(resolved.value as Record<string, unknown>);
      const partial = accessor.partialKey.toLowerCase();

      const filtered = partial
        ? keys.filter((k) => k.toLowerCase().includes(partial))
        : keys;

      filtered.sort((a, b) => {
        if (!partial) return a.localeCompare(b);
        const aStarts = a.toLowerCase().startsWith(partial);
        const bStarts = b.toLowerCase().startsWith(partial);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.localeCompare(b);
      });

      return {
        suggestions: filtered.slice(0, 50).map((k) => ({
          label: k,
          insertValue: k,
        })),
        header: null,
      };
    }

    // --- Index accessor — but the resolved value might be an object ---
    if (!Array.isArray(resolved.value)) {
      if (typeof resolved.value === "object") {
        const keys = Object.keys(resolved.value as Record<string, unknown>);
        const partial = accessor.partialIndex.toLowerCase();
        const filtered = partial
          ? keys.filter((k) => k.toLowerCase().includes(partial))
          : keys;
        filtered.sort((a, b) => a.localeCompare(b));

        const keyDelim = accessorDef
          ? getKeyInsertDelimiters(accessorDef)
          : { open: '["', close: '"]' };

        return {
          suggestions: filtered.slice(0, 50).map((k) => {
            const escaped = escapeKeyForDelimiter(k, escapeRules);
            return {
              label: k,
              insertValue: escaped,
              wrapOpen: keyDelim.open,
              wrapClose: keyDelim.close,
            };
          }),
          header: <span>Object — select a key</span>,
        };
      }
      return { suggestions: [], header: null };
    }

    // --- Array index suggestions ---
    const arr = resolved.value as unknown[];
    const partial = accessor.partialIndex.trim();

    const indices = Array.from({ length: arr.length }, (_, i) => String(i));
    const filtered = partial
      ? indices.filter((idx) => idx.startsWith(partial))
      : indices;

    return {
      suggestions: filtered.slice(0, 50).map((idx) => {
        const item = arr[Number(idx)];
        let detail: string | undefined;
        if (item === null) detail = "null";
        else if (Array.isArray(item)) detail = `array (${item.length})`;
        else if (typeof item === "object") {
          const objKeys = Object.keys(item as Record<string, unknown>);
          detail = `{${objKeys.slice(0, 3).join(", ")}${objKeys.length > 3 ? ", …" : ""}}`;
        } else {
          const s = JSON.stringify(item);
          detail = s.length > 40 ? s.slice(0, 40) + "…" : s;
        }
        return { label: idx, insertValue: idx, detail };
      }),
      header: (
        <span>
          Array with <strong>{arr.length}</strong> item{arr.length !== 1 ? "s" : ""}{" "}
          <span className="text-text-muted">
            — valid indices: 0–{arr.length - 1}
          </span>
        </span>
      ),
    };
  }, [accessor, jsonData, accessorDef]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    setDismissed(false);
  }, [value]);

  useEffect(() => {
    const active = listRef.current?.querySelector("[data-active]");
    active?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const selectSuggestion = useCallback(
    (item: SuggestionItem) => {
      if (!accessor) return;

      const escapeRules = accessorDef?.escapeRules ?? [
        { char: "\\", replacement: "\\\\" },
        { char: '"', replacement: '\\"' },
      ];

      let newValue: string;

      if (item.rawInsert !== undefined) {
        newValue = accessor.completedPath + item.rawInsert;
      } else if (item.wrapOpen !== undefined && item.wrapClose !== undefined) {
        newValue =
          accessor.completedPath + item.wrapOpen + item.insertValue + item.wrapClose;
      } else if (accessor.type === "string") {
        const escaped = escapeKeyForDelimiter(item.insertValue, escapeRules);
        newValue =
          accessor.completedPath +
          accessor.openDelimiter +
          escaped +
          accessor.closeDelimiter;
      } else {
        newValue = accessor.completedPath + "[" + item.insertValue + "]";
      }

      onChange(newValue);
      setDismissed(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [accessor, onChange, accessorDef]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Tab":
        case "Enter":
          if (suggestions.length > 0) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setDismissed(true);
          break;
      }
    },
    [suggestions, selectedIndex, selectSuggestion]
  );

  const showDropdown = suggestions.length > 0 || header;
  const partialHighlight =
    accessor?.type === "string"
      ? accessor.partialKey
      : accessor?.type === "method"
        ? accessor.partialMethod
        : undefined;

  return (
    <div className="flex gap-2 relative">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className="w-full px-3 py-2 text-sm font-mono bg-input border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
        />

        {showDropdown && (
          <div
            ref={listRef}
            className="absolute left-0 right-0 top-full mt-1 z-30 max-h-72 overflow-auto rounded-lg border border-border bg-surface shadow-xl shadow-black/40"
          >
            {header && (
              <div className="px-3 py-2 text-xs text-text-secondary border-b border-border bg-surface-hover">
                {header}
              </div>
            )}
            {suggestions.map((item, i) => {
              const isActive = i === selectedIndex;
              return (
                <button
                  key={item.label}
                  data-active={isActive ? "" : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(item);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-accent/20 text-text-primary"
                      : "text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  <span className="text-sm font-mono truncate shrink-0">
                    {partialHighlight
                      ? highlightMatch(item.label, partialHighlight)
                      : item.label}
                  </span>
                  {item.detail && (
                    <span className="text-xs text-text-muted truncate">
                      {item.detail}
                    </span>
                  )}
                </button>
              );
            })}
            {suggestions.length === 0 && header && accessor?.type === "index" && (
              <div className="px-3 py-2 text-xs text-text-muted">
                Type an index number…
              </div>
            )}
          </div>
        )}
      </div>
      <CopyButton text={value} />
    </div>
  );
}

function highlightMatch(key: string, partial: string) {
  const lower = key.toLowerCase();
  const idx = lower.indexOf(partial.toLowerCase());
  if (idx === -1) return key;

  return (
    <>
      {key.slice(0, idx)}
      <span className="text-accent-hover font-semibold">
        {key.slice(idx, idx + partial.length)}
      </span>
      {key.slice(idx + partial.length)}
    </>
  );
}
