"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { CopyButton } from "../shared/CopyButton";
import type { SearchResult } from "@/lib/search/types";
import type { Serializer } from "@/lib/serializers/types";

interface ResultCardProps {
  result: SearchResult;
  serializer: Serializer;
  serializerOptions: Record<string, unknown>;
  index: number;
  jsonInput: string;
}

function truncatePreview(value: unknown, maxLen = 120): string {
  const str = JSON.stringify(value, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

const PREVIEW_THRESHOLD = 300;

function ValuePreview({ value }: { value: unknown }) {
  const [showFull, setShowFull] = useState(false);

  const full = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  const isLong = full.length > PREVIEW_THRESHOLD;
  const displayed = showFull || !isLong ? full : full.slice(0, PREVIEW_THRESHOLD) + "\n…";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <pre className={`text-xs font-mono text-text-secondary whitespace-pre-wrap break-all p-2 bg-base rounded border border-border overflow-auto ${showFull ? "max-h-[70vh]" : "max-h-48"}`}>
          {displayed}
        </pre>
        <div className="absolute top-1.5 right-1.5">
          <CopyButton text={full} size={12} />
        </div>
      </div>
      {isLong && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="self-start text-[11px] text-accent hover:text-accent-hover transition-colors"
        >
          {showFull ? "Collapse" : `Show full value (${formatBytes(full.length)})`}
        </button>
      )}
    </div>
  );
}

function formatBytes(len: number): string {
  if (len < 1024) return `${len} chars`;
  const kb = len / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function ResultCard({
  result,
  serializer,
  serializerOptions,
  index,
  jsonInput,
}: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const serialized = useMemo(
    () => serializer.serialize(result.path, serializerOptions),
    [serializer, result.path, serializerOptions]
  );

  const parentPath = useMemo(() => {
    if (result.path.length <= 1) return serialized;
    return serializer.serialize(result.path.slice(0, -1), serializerOptions);
  }, [serializer, result.path, serializerOptions, serialized]);

  const openInExplorer = useCallback(() => {
    try {
      localStorage.setItem("jsondig-explore-data", jsonInput);
    } catch {
      // quota exceeded — unlikely for <20MB
    }
    const encoded = encodeURIComponent(parentPath);
    window.open(`/explore?path=${encoded}`, "_blank");
  }, [jsonInput, parentPath]);

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

        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={openInExplorer}
            className="inline-flex items-center justify-center rounded p-1.5 text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
            title="Explore parent in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <CopyButton text={serialized} />
        </div>
      </div>

      {expanded && result.resolvedValue !== undefined && (
        <div className="px-3 pb-3 pt-0 pl-10">
          <ValuePreview value={result.resolvedValue} />
        </div>
      )}
    </div>
  );
}
