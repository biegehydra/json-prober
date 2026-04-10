"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { JsonView } from "@/components/shared/JsonView";
import { PathInput } from "@/components/shared/PathInput";
import { SerializerSelect } from "@/components/serializer/SerializerSelect";
import { parseJson } from "@/lib/parser";
import { parseBracketPath, resolvePathSegments, reconcileSegments, checkPathAmbiguity } from "@/lib/path-resolver";
import { registerAllPresets } from "@/lib/serializers/presets";
import { getAllSerializers, getSerializer } from "@/lib/serializers/registry";
import { convertPath } from "@/lib/serializers/serialize";
import { useSerializerStore } from "@/stores/serializer";
import type { AccessorDefinition } from "@/lib/serializers/types";
import { loadExploreJson } from "@/lib/json-storage";
import { trackChangeSerializer } from "@/lib/analytics";

registerAllPresets();

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialPath = searchParams.get("path") ?? "";

  const [pathInput, setPathInput] = useState(initialPath);
  const [jsonData, setJsonData] = useState<unknown>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const serializerId = useSerializerStore((s) => s.serializerId);
  const rawSetSerializerId = useSerializerStore((s) => s.setSerializerId);
  const setSerializerId = useCallback((id: string) => {
    rawSetSerializerId(id);
    trackChangeSerializer(id);
  }, [rawSetSerializerId]);

  const allSerializers = useMemo(() => getAllSerializers(), []);
  const currentSerializer = useMemo(
    () => getSerializer(serializerId) ?? allSerializers[0],
    [serializerId, allSerializers]
  );

  const prevSerializerRef = useRef<{ id: string; def?: AccessorDefinition }>({
    id: serializerId,
    def: currentSerializer?.definition,
  });
  useEffect(() => {
    const prev = prevSerializerRef.current;
    if (prev.id === serializerId) return;

    const fromDef = prev.def;
    prevSerializerRef.current = { id: serializerId, def: currentSerializer?.definition };

    if (!currentSerializer || !pathInput.trim()) return;

    const converted = convertPath(
      pathInput,
      currentSerializer.definition,
      jsonData,
      fromDef
    );
    if (converted !== pathInput) {
      setPathInput(converted);
    }
  }, [serializerId, currentSerializer, pathInput, jsonData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await loadExploreJson();
        if (cancelled) return;
        if (!raw) {
          setLoadError("No JSON data found. Go back to the main page and open a result.");
          return;
        }
        const parsed = parseJson(raw);
        if (!parsed.success || parsed.data === undefined) {
          setLoadError("Failed to parse stored JSON data.");
          return;
        }
        setJsonData(parsed.data);
      } catch {
        if (!cancelled) setLoadError("Failed to read JSON data from storage.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const accessorDef = currentSerializer?.definition;

  const resolved = useMemo(() => {
    if (jsonData === undefined) return { value: undefined, error: undefined };
    if (!pathInput.trim()) return { value: jsonData, error: undefined };
    let segments = parseBracketPath(pathInput);
    if (segments.length === 0) return { value: jsonData, error: undefined };

    if (accessorDef?.keyAccess.type === "property") {
      const reconciled = reconcileSegments(segments, jsonData, accessorDef.keyAccess);
      segments = reconciled.segments;
    }

    return resolvePathSegments(jsonData, segments);
  }, [jsonData, pathInput, accessorDef]);

  const ambiguity = useMemo(() => {
    if (jsonData === undefined || !pathInput.trim()) return null;
    if (accessorDef?.keyAccess.type !== "property") return null;
    const segments = parseBracketPath(pathInput);
    if (segments.length === 0) return null;
    return checkPathAmbiguity(segments, jsonData, accessorDef.keyAccess);
  }, [jsonData, pathInput, accessorDef]);

  const beautified = useMemo(() => {
    if (resolved.value === undefined && resolved.error) return "";
    try {
      return JSON.stringify(resolved.value, null, 2) ?? "undefined";
    } catch {
      return String(resolved.value);
    }
  }, [resolved]);

  const handlePathChange = useCallback((value: string) => {
    setPathInput(value);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-panel">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </a>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Path Explorer
        </span>
        <div className="ml-auto">
          <SerializerSelect
            serializers={allSerializers}
            selectedId={currentSerializer?.definition.id ?? serializerId}
            onSelect={setSerializerId}
          />
        </div>
      </header>

      {loadError ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm text-error">
            <AlertCircle size={18} />
            {loadError}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Path input bar */}
          <div className="shrink-0 p-4 border-b border-border bg-panel">
            <label className="block text-xs text-text-secondary mb-1.5">
              Accessor path (edit to navigate)
            </label>
            <PathInput
              value={pathInput}
              onChange={handlePathChange}
              jsonData={jsonData}
              placeholder='e.g. root["data"]["sections"][0]'
              accessorDef={accessorDef}
            />
            {ambiguity && (
              <p className="mt-2 text-xs text-yellow-500 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Ambiguous path: &quot;{ambiguity.transformedKey}&quot; matches multiple keys ({ambiguity.originalKeys.join(", ")})
              </p>
            )}
            {resolved.error && !ambiguity && (
              <p className="mt-2 text-xs text-error flex items-center gap-1.5">
                <AlertCircle size={12} />
                {resolved.error}
              </p>
            )}
          </div>

          {/* Beautified JSON output */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {beautified && (
              <div className="absolute top-2 right-4 z-10">
                <CopyButton text={beautified} />
              </div>
            )}
            <JsonView value={beautified} maxHeight="none" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-sm text-text-muted">
          Loading...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
