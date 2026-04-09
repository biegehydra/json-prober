"use client";

import { useState, useMemo, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { ProberIcon } from "@/components/shared/ProberIcon";
import { JsonEditor } from "@/components/json-input/JsonEditor";
import { SearchPanel } from "@/components/search/SearchPanel";
import { SerializerControls } from "@/components/serializer/SerializerControls";
import { ResultsList } from "@/components/results/ResultsList";
import { ResizablePanels } from "@/components/shared/ResizablePanels";
import { parseJson } from "@/lib/parser";
import { searchJson } from "@/lib/search/engine";
import { DEFAULT_SEARCH_OPTIONS } from "@/lib/search/types";
import type { SearchOptions } from "@/lib/search/types";
import { registerAllPresets } from "@/lib/serializers/presets";
import { getAllSerializers, getSerializer } from "@/lib/serializers/registry";
import { useSerializerStore } from "@/stores/serializer";
import { trackExploreRoot, trackClickGithub } from "@/lib/analytics";

registerAllPresets();

export default function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(
    DEFAULT_SEARCH_OPTIONS
  );

  const serializerId = useSerializerStore((s) => s.serializerId);
  const serializerOptions = useSerializerStore((s) => s.serializerOptions);
  const setSerializerId = useSerializerStore((s) => s.setSerializerId);
  const setSerializerOptions = useSerializerStore((s) => s.setSerializerOptions);

  const allSerializers = useMemo(() => getAllSerializers(), []);
  const currentSerializer = useMemo(
    () => getSerializer(serializerId) ?? allSerializers[0],
    [serializerId, allSerializers]
  );

  const parseResult = useMemo(() => parseJson(jsonInput), [jsonInput]);

  const openRootInExplorer = useCallback(() => {
    try {
      localStorage.setItem("jsonprober-explore-data", jsonInput);
    } catch {
      // quota exceeded
    }
    const rootVar = (serializerOptions.rootVar as string) || "root";
    window.open(`/explore?path=${encodeURIComponent(rootVar)}`, "_blank");
    trackExploreRoot();
  }, [jsonInput, serializerOptions]);

  const searchResults = useMemo(() => {
    if (!parseResult.success || !parseResult.data) return [];
    if (!searchOptions.query && !searchOptions.numericMode) return [];
    return searchJson(parseResult.data, searchOptions);
  }, [parseResult, searchOptions]);

  const leftPanel = (
    <JsonEditor
      value={jsonInput}
      onChange={setJsonInput}
      error={
        parseResult.error
          ? `Parse error: ${parseResult.error.message} (offset ${parseResult.error.offset})`
          : undefined
      }
    />
  );

  const rightPanel = (
    <>
      <div className="shrink-0 flex flex-col gap-4 p-4 border-b border-border">
        <SearchPanel
          options={searchOptions}
          onChange={setSearchOptions}
          resultCount={searchResults.length}
          hasJson={parseResult.success}
        />

        <div className="border-t border-border pt-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            {currentSerializer && (
              <SerializerControls
                serializers={allSerializers}
                selectedId={serializerId}
                onSelectId={setSerializerId}
                options={serializerOptions}
                onChangeOptions={setSerializerOptions}
              />
            )}
          </div>
          {parseResult.success && (
            <button
              onClick={openRootInExplorer}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
              title="Open full JSON in Path Explorer"
            >
              <ExternalLink size={12} />
              Explore
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {!parseResult.success && !jsonInput && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <ProberIcon size={32} />
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

        {parseResult.success &&
          !searchOptions.query &&
          !searchOptions.numericMode && (
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
            parsedData={parseResult.data}
          />
        )}

        {parseResult.success &&
          (searchOptions.query || searchOptions.numericMode) &&
          searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
              <p className="text-sm text-text-secondary">No matches found</p>
              <p className="text-xs text-text-muted">
                Try a different search term or match type
              </p>
            </div>
          )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border bg-panel">
        <div className="flex items-center gap-3">
          <ProberIcon size={36} className="-my-2" />
          <h1 className="text-base font-semibold tracking-tight text-text-primary">JSON Prober</h1>
          <span className="hidden sm:inline text-sm text-text-secondary">
            Search JSON, generate accessor code
          </span>
        </div>
        <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs text-text-muted">
          Created by <span className="text-text-secondary">Connor Hallman</span>
        </span>
        <a
          href="https://github.com/biegehydra/json-prober"
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackClickGithub}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </a>
        </div>
      </header>

      {/* Main content — resizable panels */}
      <ResizablePanels left={leftPanel} right={rightPanel} />
    </div>
  );
}
