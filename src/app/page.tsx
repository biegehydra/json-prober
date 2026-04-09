"use client";

import { useState, useMemo } from "react";
import { Shovel } from "lucide-react";
import { JsonEditor } from "@/components/json-input/JsonEditor";
import { SearchPanel } from "@/components/search/SearchPanel";
import { SerializerControls } from "@/components/serializer/SerializerControls";
import { ResultsList } from "@/components/results/ResultsList";
import { parseJson } from "@/lib/parser";
import { searchJson } from "@/lib/search/engine";
import { DEFAULT_SEARCH_OPTIONS } from "@/lib/search/types";
import type { SearchOptions } from "@/lib/search/types";
import {
  registerAllPresets,
} from "@/lib/serializers/presets";
import {
  getAllSerializers,
  getSerializer,
} from "@/lib/serializers/registry";
import { useLocalStorage } from "@/hooks/useLocalStorage";

registerAllPresets();

export default function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(
    DEFAULT_SEARCH_OPTIONS
  );

  const [serializerId, setSerializerId] = useLocalStorage(
    "jsondig-serializer",
    "csharp-newtonsoft"
  );
  const [serializerOptions, setSerializerOptions] = useLocalStorage<
    Record<string, unknown>
  >("jsondig-serializer-opts", {});

  const allSerializers = useMemo(() => getAllSerializers(), []);
  const currentSerializer = useMemo(
    () => getSerializer(serializerId) ?? allSerializers[0],
    [serializerId, allSerializers]
  );

  const handleSerializerChange = (id: string) => {
    setSerializerId(id);
    setSerializerOptions({});
  };

  const parseResult = useMemo(() => parseJson(jsonInput), [jsonInput]);

  const searchResults = useMemo(() => {
    if (!parseResult.success || !parseResult.data) return [];
    if (!searchOptions.query && !searchOptions.numericMode) return [];
    return searchJson(parseResult.data, searchOptions);
  }, [parseResult, searchOptions]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-panel">
        <div className="flex items-center gap-2.5">
          <Shovel size={18} className="text-accent" />
          <h1 className="text-sm font-semibold tracking-tight">JSONdig</h1>
          <span className="hidden sm:inline text-xs text-text-muted">
            Search JSON, get code
          </span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          GitHub
        </a>
      </header>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left panel — JSON input */}
        <div className="lg:w-1/2 xl:w-[45%] min-h-[200px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col bg-panel">
          <JsonEditor
            value={jsonInput}
            onChange={setJsonInput}
            error={
              parseResult.error
                ? `Parse error: ${parseResult.error.message} (offset ${parseResult.error.offset})`
                : undefined
            }
          />
        </div>

        {/* Right panel — Search + Output + Results */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-panel">
          <div className="shrink-0 flex flex-col gap-4 p-4 border-b border-border">
            <SearchPanel
              options={searchOptions}
              onChange={setSearchOptions}
              resultCount={searchResults.length}
              hasJson={parseResult.success}
            />

            <div className="border-t border-border pt-3">
              {currentSerializer && (
                <SerializerControls
                  serializers={allSerializers}
                  selectedId={serializerId}
                  onSelectId={handleSerializerChange}
                  options={serializerOptions}
                  onChangeOptions={setSerializerOptions}
                />
              )}
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 min-h-0 overflow-auto p-4">
            {!parseResult.success && !jsonInput && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                <Shovel size={32} className="text-text-muted" />
                <div>
                  <p className="text-sm text-text-secondary">
                    Paste or upload JSON to get started
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Then search by key or value to find paths
                  </p>
                </div>
              </div>
            )}

            {parseResult.success && !searchOptions.query && !searchOptions.numericMode && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                <p className="text-sm text-text-secondary">
                  JSON parsed successfully
                </p>
                <p className="text-xs text-text-muted">
                  Enter a search term above to find paths
                </p>
              </div>
            )}

            {currentSerializer && searchResults.length > 0 && (
              <ResultsList
                results={searchResults}
                serializer={currentSerializer}
                serializerOptions={serializerOptions}
                jsonInput={jsonInput}
              />
            )}

            {parseResult.success &&
              (searchOptions.query || searchOptions.numericMode) &&
              searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                  <p className="text-sm text-text-secondary">
                    No matches found
                  </p>
                  <p className="text-xs text-text-muted">
                    Try a different search term or match type
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
