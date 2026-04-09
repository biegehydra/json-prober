"use client";

import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";

interface JsonViewProps {
  value: string;
  maxHeight?: string;
  scrollable?: boolean;
}

const readonlyExt = EditorState.readOnly.of(true);

export function JsonView({ value, maxHeight = "20rem", scrollable = true }: JsonViewProps) {
  const isFill = maxHeight === "none";
  return (
    <div
      className={
        scrollable
          ? `overflow-auto ${isFill ? "h-full" : "rounded border border-border"}`
          : "rounded border border-border overflow-hidden"
      }
      style={scrollable && !isFill ? { maxHeight } : undefined}
    >
      <CodeMirror
        value={value}
        extensions={[json(), readonlyExt]}
        theme={oneDark}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: false,
          bracketMatching: true,
          autocompletion: false,
        }}
        readOnly
        height={scrollable ? undefined : "auto"}
      />
    </div>
  );
}
