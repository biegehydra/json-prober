"use client";

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
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
          Results
        </span>
        <span className="text-xs text-text-secondary tabular-nums">
          {results.length}
        </span>
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
