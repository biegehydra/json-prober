"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CopyButton } from "../shared/CopyButton";
import type { SearchResult } from "@/lib/search/types";
import type { Serializer } from "@/lib/serializers/types";

interface ResultCardProps {
  result: SearchResult;
  serializer: Serializer;
  serializerOptions: Record<string, unknown>;
  index: number;
}

function truncatePreview(value: unknown, maxLen = 120): string {
  const str = JSON.stringify(value, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function ValuePreview({ value }: { value: unknown }) {
  const preview = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  const isLong = preview.length > 200;

  return (
    <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap break-all p-2 bg-base rounded border border-border max-h-48 overflow-auto">
      {isLong ? preview.slice(0, 500) + "\n..." : preview}
    </pre>
  );
}

export function ResultCard({
  result,
  serializer,
  serializerOptions,
  index,
}: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const serialized = useMemo(
    () => serializer.serialize(result.path, serializerOptions),
    [serializer, result.path, serializerOptions]
  );

  const matchLabel = result.matchedOn === "key" ? "Key" : "Value";
  const matchDisplay =
    result.matchedOn === "key"
      ? result.matchedKey
      : truncatePreview(result.matchedValue, 80);

  return (
    <div className="border border-border rounded-lg bg-surface hover:bg-surface-hover transition-colors group">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 p-0.5 text-text-muted hover:text-text-secondary shrink-0"
        >
          {expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted tabular-nums">
              #{index + 1}
            </span>
            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-accent-muted text-accent-hover">
              {matchLabel}
            </span>
            {result.matchedOn === "key" && result.matchedKey && (
              <span className="text-xs text-key font-mono truncate">
                {result.matchedKey}
              </span>
            )}
          </div>

          <div className="mt-1.5 font-mono text-sm text-text-primary break-all leading-relaxed">
            {serialized}
          </div>

          {result.matchedOn === "value" && result.matchedValue !== undefined && (
            <div className="mt-1 text-xs text-text-muted font-mono truncate">
              = {matchDisplay}
            </div>
          )}
        </div>

        <CopyButton text={serialized} className="shrink-0 opacity-0 group-hover:opacity-100" />
      </div>

      {expanded && result.resolvedValue !== undefined && (
        <div className="px-3 pb-3 pt-0 pl-10">
          <ValuePreview value={result.resolvedValue} />
        </div>
      )}
    </div>
  );
}
