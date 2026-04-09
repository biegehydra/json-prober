"use client";

import { useCallback } from "react";
import { Search, X, Plus } from "lucide-react";
import type {
  SearchOptions,
  SearchMode,
  MatchType,
  NumericComparison,
  JsonType,
} from "@/lib/search/types";

interface SearchPanelProps {
  options: SearchOptions;
  onChange: (options: SearchOptions) => void;
  resultCount: number;
  hasJson: boolean;
}

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: "value", label: "Value" },
  { value: "key", label: "Key" },
  { value: "both", label: "Both" },
];

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
  { value: "regex", label: "Regex" },
];

const NUMERIC_COMPARISONS: { value: NumericComparison; label: string }[] = [
  { value: "eq", label: "=" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "between", label: "Between" },
];

const TYPE_FILTERS: { value: JsonType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "null", label: "Null" },
  { value: "object", label: "Object" },
  { value: "array", label: "Array" },
];

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SearchPanel({
  options,
  onChange,
  resultCount,
  hasJson,
}: SearchPanelProps) {
  const update = useCallback(
    (partial: Partial<SearchOptions>) => {
      onChange({ ...options, ...partial });
    },
    [options, onChange]
  );

  const showNumericControls =
    options.numericMode && (options.mode === "value" || options.mode === "both");

  const addIgnoreKey = useCallback(
    (key: string) => {
      if (key && !options.ignoreKeys.includes(key)) {
        update({ ignoreKeys: [...options.ignoreKeys, key] });
      }
    },
    [options.ignoreKeys, update]
  );

  const removeIgnoreKey = useCallback(
    (key: string) => {
      update({ ignoreKeys: options.ignoreKeys.filter((k) => k !== key) });
    },
    [options.ignoreKeys, update]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={options.numericMode ? "" : options.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder={
            hasJson
              ? options.mode === "key"
                ? "Search for key names..."
                : options.mode === "value"
                  ? "Search for values..."
                  : "Search keys and values..."
              : "Paste JSON first..."
          }
          disabled={!hasJson || options.numericMode}
          className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors disabled:opacity-40"
        />
        {options.query && !options.numericMode && (
          <button
            onClick={() => update({ query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search mode + match type row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">Mode</span>
          <ToggleGroup
            options={SEARCH_MODES}
            value={options.mode}
            onChange={(mode) => update({ mode })}
          />
        </div>

        {!options.numericMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-medium">Match</span>
            <select
              value={options.matchType}
              onChange={(e) =>
                update({ matchType: e.target.value as MatchType })
              }
              className="px-2 py-1 text-xs bg-input border border-border rounded text-text-primary focus:outline-none focus:border-border-focus"
            >
              {MATCH_TYPES.map((mt) => (
                <option key={mt.value} value={mt.value}>
                  {mt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={options.caseSensitive}
            onChange={(e) => update({ caseSensitive: e.target.checked })}
            className="accent-accent"
          />
          Case sensitive
        </label>
      </div>

      {/* Numeric mode toggle (only for value or both) */}
      {(options.mode === "value" || options.mode === "both") && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={options.numericMode}
              onChange={(e) => update({ numericMode: e.target.checked })}
              className="accent-accent"
            />
            Numeric comparison
          </label>

          {showNumericControls && (
            <>
              <select
                value={options.numericComparison}
                onChange={(e) =>
                  update({
                    numericComparison: e.target.value as NumericComparison,
                  })
                }
                className="px-2 py-1 text-xs bg-input border border-border rounded text-text-primary focus:outline-none focus:border-border-focus"
              >
                {NUMERIC_COMPARISONS.map((nc) => (
                  <option key={nc.value} value={nc.value}>
                    {nc.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={options.numericValue}
                onChange={(e) =>
                  update({ numericValue: parseFloat(e.target.value) || 0 })
                }
                className="w-24 px-2 py-1 text-xs bg-input border border-border rounded text-text-primary focus:outline-none focus:border-border-focus"
                placeholder="Value"
              />

              {options.numericComparison === "between" && (
                <>
                  <span className="text-xs text-text-secondary">and</span>
                  <input
                    type="number"
                    value={options.numericValueEnd}
                    onChange={(e) =>
                      update({
                        numericValueEnd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-2 py-1 text-xs bg-input border border-border rounded text-text-primary focus:outline-none focus:border-border-focus"
                    placeholder="End"
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Type filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary font-medium">Types</span>
        {TYPE_FILTERS.map((tf) => {
          const active = options.typeFilter.includes(tf.value);
          return (
            <button
              key={tf.value}
              onClick={() => {
                const next = active
                  ? options.typeFilter.filter((t) => t !== tf.value)
                  : [...options.typeFilter, tf.value];
                update({ typeFilter: next });
              }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                active
                  ? "border-accent bg-accent-muted text-accent-hover font-medium"
                  : "border-chip-border bg-chip text-chip-text hover:text-text-primary hover:border-border-hover hover:bg-surface-hover"
              }`}
            >
              {tf.label}
            </button>
          );
        })}
        {options.typeFilter.length > 0 && (
          <button
            onClick={() => update({ typeFilter: [] })}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ignore keys */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary font-medium">Ignore keys</span>
        {options.ignoreKeys.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-chip border border-chip-border text-chip-text"
          >
            {key}
            <button
              onClick={() => removeIgnoreKey(key)}
              className="hover:text-error transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <button
          onClick={() => {
            const key = prompt("Key name to ignore:");
            if (key) addIgnoreKey(key.trim());
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-dashed border-chip-border text-chip-text hover:text-text-primary hover:border-border-hover transition-colors"
        >
          <Plus size={10} />
          Add
        </button>
      </div>

      {/* Result count */}
      {hasJson && (options.query || options.numericMode) && (
        <div className="text-xs text-text-secondary">
          {resultCount === 0
            ? "No matches found"
            : `${resultCount} match${resultCount !== 1 ? "es" : ""} found`}
          {resultCount >= options.maxResults && (
            <span className="text-warning ml-1">
              (capped at {options.maxResults})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
