"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";
import { ResultCard } from "./ResultCard";
import type { SearchResult } from "@/lib/search/types";
import type { Serializer } from "@/lib/serializers/types";

interface ResultsListProps {
  results: SearchResult[];
  serializer: Serializer;
  serializerOptions: Record<string, unknown>;
  jsonInput: string;
}

export function ResultsList({
  results,
  serializer,
  serializerOptions,
  jsonInput,
}: ResultsListProps) {
  const allSerialized = useMemo(
    () =>
      results
        .map((r) => serializer.serialize(r.path, serializerOptions))
        .join("\n"),
    [results, serializer, serializerOptions]
  );

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
          Results
        </span>
        {results.length > 1 && (
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(allSerialized);
            }}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted hover:text-text-secondary rounded border border-border hover:border-border-hover transition-colors"
          >
            <Copy size={12} />
            Copy all
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {results.map((result, i) => (
          <ResultCard
            key={i}
            result={result}
            serializer={serializer}
            serializerOptions={serializerOptions}
            index={i}
            jsonInput={jsonInput}
          />
        ))}
      </div>
    </div>
  );
}
