"use client";

import { useCallback } from "react";
import CodeMirror, { type ViewUpdate } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { Upload } from "lucide-react";
import { trackPasteJson, trackUploadJson } from "@/lib/analytics";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function tryBeautify(text: string): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

export function JsonEditor({ value, onChange, error }: JsonEditorProps) {
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          onChange(tryBeautify(text));
          trackUploadJson();
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onChange]
  );

  const handleEditorChange = useCallback(
    (val: string, viewUpdate: ViewUpdate) => {
      const isPaste = viewUpdate.transactions.some((tr) =>
        tr.isUserEvent("input.paste")
      );
      if (isPaste) {
        onChange(tryBeautify(val));
        trackPasteJson();
      } else {
        onChange(val);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          JSON Input
        </span>
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-border text-text-secondary hover:text-text-primary hover:border-border-hover cursor-pointer transition-colors">
          <Upload size={12} />
          Upload
          <input
            type="file"
            accept=".json,.jsonc"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-auto">
          <CodeMirror
            value={value}
            onChange={handleEditorChange}
            extensions={[json()]}
            theme={oneDark}
            placeholder="Paste your JSON here..."
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
              autocompletion: false,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-3 py-2 text-xs text-error border-t border-border bg-error/5">
          {error}
        </div>
      )}
    </div>
  );
}
