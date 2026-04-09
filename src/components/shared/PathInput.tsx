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

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  jsonData: unknown;
  placeholder?: string;
}

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

type OpenAccessor = OpenStringAccessor | OpenIndexAccessor;

const STRING_DELIMITERS = [
  { open: '["', close: '"]' },
  { open: '("', close: '")' },
];

function detectOpenAccessor(input: string): OpenAccessor | null {
  // First check for open string accessor — has higher priority
  let bestStringPos = -1;
  let bestString: OpenStringAccessor | null = null;

  for (const { open, close } of STRING_DELIMITERS) {
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

  // Check for open bare bracket (index accessor): [ not followed by "
  let bestIndexPos = -1;
  let bestIndex: OpenIndexAccessor | null = null;

  let idxSearch = input.length;
  while (idxSearch > 0) {
    const pos = input.lastIndexOf("[", idxSearch - 1);
    if (pos === -1) break;

    const charAfterBracket = input[pos + 1];
    // Skip if this is a string accessor ["
    if (charAfterBracket === '"') {
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

  // Return whichever is later in the string (more relevant)
  if (bestString && bestIndex) {
    return bestStringPos > bestIndexPos ? bestString : bestIndex;
  }
  return bestString ?? bestIndex;
}

function escapeKey(key: string, delimiter: string): string {
  let escaped = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (delimiter === '("') {
    escaped = escaped.replace(/\)/g, "\\)");
  }
  return escaped;
}

interface SuggestionItem {
  label: string;
  insertValue: string;
  detail?: string;
  /** When set, wraps the value with these delimiters instead of using the accessor's own */
  wrapOpen?: string;
  wrapClose?: string;
}

export function PathInput({
  value,
  onChange,
  jsonData,
  placeholder,
}: PathInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const accessor = useMemo(() => {
    if (dismissed) return null;
    return detectOpenAccessor(value);
  }, [value, dismissed]);

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

    // Index accessor — but the resolved value might be an object
    if (!Array.isArray(resolved.value)) {
      if (typeof resolved.value === "object") {
        const keys = Object.keys(resolved.value as Record<string, unknown>);
        const partial = accessor.partialIndex.toLowerCase();
        const filtered = partial
          ? keys.filter((k) => k.toLowerCase().includes(partial))
          : keys;
        filtered.sort((a, b) => a.localeCompare(b));

        return {
          suggestions: filtered.slice(0, 50).map((k) => ({
            label: k,
            insertValue: k,
            wrapOpen: '["',
            wrapClose: '"]',
          })),
          header: (
            <span>
              Object — select a key
            </span>
          ),
        };
      }
      return { suggestions: [], header: null };
    }

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
          const keys = Object.keys(item as Record<string, unknown>);
          detail = `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", …" : ""}}`;
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
  }, [accessor, jsonData]);

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

      let newValue: string;
      if (item.wrapOpen !== undefined && item.wrapClose !== undefined) {
        const escaped = escapeKey(item.insertValue, item.wrapOpen);
        newValue =
          accessor.completedPath + item.wrapOpen + escaped + item.wrapClose;
      } else if (accessor.type === "string") {
        const escaped = escapeKey(item.insertValue, accessor.openDelimiter);
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
    [accessor, onChange]
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
                    {accessor?.type === "string" && accessor.partialKey
                      ? highlightMatch(item.label, accessor.partialKey)
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
