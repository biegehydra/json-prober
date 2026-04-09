"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";
import { CopyButton } from "@/components/shared/CopyButton";
import { PathInput } from "@/components/shared/PathInput";
import { SerializerSelect } from "@/components/serializer/SerializerSelect";
import { parseJson } from "@/lib/parser";
import { parseBracketPath, resolvePathSegments } from "@/lib/path-resolver";
import { registerAllPresets } from "@/lib/serializers/presets";
import { getAllSerializers, getSerializer } from "@/lib/serializers/registry";
import { convertPath } from "@/lib/serializers/serialize";
import { useSerializerStore } from "@/stores/serializer";

registerAllPresets();

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialPath = searchParams.get("path") ?? "";

  const [pathInput, setPathInput] = useState(initialPath);
  const [jsonData, setJsonData] = useState<unknown>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const serializerId = useSerializerStore((s) => s.serializerId);
  const setSerializerId = useSerializerStore((s) => s.setSerializerId);

  const allSerializers = useMemo(() => getAllSerializers(), []);
  const currentSerializer = useMemo(
    () => getSerializer(serializerId) ?? allSerializers[0],
    [serializerId, allSerializers]
  );

  const prevSerializerIdRef = useRef(serializerId);
  useEffect(() => {
    const prevId = prevSerializerIdRef.current;
    if (prevId === serializerId) return;
    prevSerializerIdRef.current = serializerId;

    if (!currentSerializer || !pathInput.trim()) return;

    const converted = convertPath(pathInput, currentSerializer.definition);
    if (converted !== pathInput) {
      setPathInput(converted);
    }
  }, [serializerId, currentSerializer, pathInput]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jsonprober-explore-data");
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
      setLoadError("Failed to read JSON data from storage.");
    }
  }, []);

  const resolved = useMemo(() => {
    if (jsonData === undefined) return { value: undefined, error: undefined };
    if (!pathInput.trim()) return { value: jsonData, error: undefined };
    const segments = parseBracketPath(pathInput);
    if (segments.length === 0) return { value: jsonData, error: undefined };
    return resolvePathSegments(jsonData, segments);
  }, [jsonData, pathInput]);

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

  const accessorDef = currentSerializer?.definition;

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
            {resolved.error && (
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
            <div className="h-full overflow-auto">
              <CodeMirror
                value={beautified}
                extensions={[
                  json(),
                  EditorState.readOnly.of(true),
                ]}
                theme={oneDark}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                  bracketMatching: true,
                  autocompletion: false,
                }}
                readOnly
              />
            </div>
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
