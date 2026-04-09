"use client";

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react";
import { parseBracketPath, resolvePathSegments } from "@/lib/path-resolver";
import { CopyButton } from "./CopyButton";

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  jsonData: unknown;
  placeholder?: string;
}

interface OpenAccessor {
  completedPath: string;
  partialKey: string;
  openDelimiter: string;
  closeDelimiter: string;
  insertStart: number;
}

const ACCESSOR_DELIMITERS = [
  { open: '["', close: '"]' },
  { open: '("', close: '")' },
];

function detectOpenAccessor(input: string): OpenAccessor | null {
  let best: OpenAccessor | null = null;
  let bestPos = -1;

  for (const { open, close } of ACCESSOR_DELIMITERS) {
    let searchFrom = input.length;
    while (searchFrom > 0) {
      const pos = input.lastIndexOf(open, searchFrom - 1);
      if (pos === -1) break;

      const afterOpen = input.substring(pos + open.length);
      if (!afterOpen.includes(close)) {
        if (pos > bestPos) {
          bestPos = pos;
          best = {
            completedPath: input.substring(0, pos),
            partialKey: afterOpen,
            openDelimiter: open,
            closeDelimiter: close,
            insertStart: pos + open.length,
          };
        }
        break;
      }
      searchFrom = pos;
    }
  }

  return best;
}

function escapeKey(key: string, delimiter: string): string {
  let escaped = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (delimiter === '("') {
    escaped = escaped.replace(/\)/g, "\\)");
  }
  return escaped;
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

  const suggestions = useMemo(() => {
    if (!accessor || jsonData === undefined) return [];

    const segments = parseBracketPath(accessor.completedPath);
    const resolved = resolvePathSegments(jsonData, segments);

    if (
      resolved.error ||
      resolved.value === null ||
      resolved.value === undefined ||
      typeof resolved.value !== "object" ||
      Array.isArray(resolved.value)
    ) {
      return [];
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

    return filtered.slice(0, 50);
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
    (key: string) => {
      if (!accessor) return;
      const escaped = escapeKey(key, accessor.openDelimiter);
      const newValue =
        accessor.completedPath +
        accessor.openDelimiter +
        escaped +
        accessor.closeDelimiter;
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

  const showDropdown = suggestions.length > 0;

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
            className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-auto rounded-lg border border-border bg-surface shadow-xl shadow-black/40"
          >
            {suggestions.map((key, i) => {
              const isActive = i === selectedIndex;
              return (
                <button
                  key={key}
                  data-active={isActive ? "" : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(key);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-3 py-1.5 text-sm font-mono truncate transition-colors ${
                    isActive
                      ? "bg-accent/20 text-text-primary"
                      : "text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {accessor?.partialKey ? highlightMatch(key, accessor.partialKey) : key}
                </button>
              );
            })}
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
