"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import { CopyButton } from "../shared/CopyButton";
import { JsonView } from "../shared/JsonView";
import { checkPathAmbiguity } from "@/lib/path-resolver";
import type { SearchResult } from "@/lib/search/types";
import type { Serializer } from "@/lib/serializers/types";

interface ResultCardProps {
  result: SearchResult;
  serializer: Serializer;
  serializerOptions: Record<string, unknown>;
  index: number;
  jsonInput: string;
  parsedData?: unknown;
}

function truncatePreview(value: unknown, maxLen = 120): string {
  const str = JSON.stringify(value, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function ValuePreview({ value }: { value: unknown }) {
  const full = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <div className="absolute top-1.5 right-3 z-10">
          <CopyButton text={full} size={12} />
        </div>
        <JsonView value={full} scrollable={false} />
      </div>
    </div>
  );
}

export function ResultCard({
  result,
  serializer,
  serializerOptions,
  index,
  jsonInput,
  parsedData,
}: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const serialized = useMemo(
    () => serializer.serialize(result.path, serializerOptions),
    [serializer, result.path, serializerOptions]
  );

  const ambiguity = useMemo(() => {
    if (parsedData === undefined) return null;
    const access = serializer.definition.keyAccess;
    if (access.type !== "property") return null;
    return checkPathAmbiguity(result.path, parsedData, access);
  }, [result.path, parsedData, serializer.definition.keyAccess]);

  const openInExplorer = useCallback(() => {
    if (ambiguity) return;
    try {
      localStorage.setItem("jsonprober-explore-data", jsonInput);
    } catch {
      // quota exceeded
    }
    const encoded = encodeURIComponent(serialized);
    window.open(`/explore?path=${encoded}`, "_blank");
  }, [jsonInput, serialized, ambiguity]);

  const matchLabel = result.matchedOn === "key" ? "Key" : "Value";
  const matchDisplay =
    result.matchedOn === "key"
      ? result.matchedKey
      : truncatePreview(result.matchedValue, 80);

  return (
    <div className={`border rounded-lg bg-surface hover:bg-surface-hover transition-colors ${ambiguity ? "border-yellow-500/40" : "border-border"}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer select-none"
      >
        <span className="mt-0.5 p-0.5 text-text-muted shrink-0">
          {expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted tabular-nums">
              #{index + 1}
            </span>
            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-accent-muted text-accent-hover">
              {matchLabel}
            </span>
            {ambiguity && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/15 text-yellow-500">
                <AlertTriangle size={10} />
                Ambiguous
              </span>
            )}
            {result.matchedOn === "key" && result.matchedKey && (
              <span className="text-xs text-key font-mono truncate">
                {result.matchedKey}
              </span>
            )}
          </div>

          <div className="mt-1.5 font-mono text-sm text-text-primary break-all leading-relaxed">
            {serialized}
          </div>

          {ambiguity && (
            <div className="mt-1 text-[11px] text-yellow-500/80">
              &quot;{ambiguity.transformedKey}&quot; matches: {ambiguity.originalKeys.join(", ")}
            </div>
          )}

          {result.matchedOn === "value" && result.matchedValue !== undefined && (
            <div className="mt-1 text-xs text-text-muted font-mono truncate">
              = {matchDisplay}
            </div>
          )}
        </div>

        <div
          className="shrink-0 flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={openInExplorer}
            disabled={!!ambiguity}
            className={`inline-flex items-center justify-center rounded p-1.5 transition-colors ${
              ambiguity
                ? "text-text-muted/30 cursor-not-allowed"
                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
            }`}
            title={ambiguity ? "Cannot explore ambiguous path" : "Explore parent in new tab"}
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
