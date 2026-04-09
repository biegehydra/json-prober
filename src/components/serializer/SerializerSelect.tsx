"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Serializer } from "@/lib/serializers/types";
import { getLanguageLabel, getLanguageColor } from "@/lib/serializers/languages";

interface SerializerSelectProps {
  serializers: Serializer[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function LanguageChip({ language }: { language: string }) {
  const { bg, text } = getLanguageColor(language);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 leading-none"
      style={{ backgroundColor: bg, color: text }}
    >
      {getLanguageLabel(language)}
    </span>
  );
}

export function SerializerSelect({
  serializers,
  selectedId,
  onSelect,
}: SerializerSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = serializers.find((s) => s.definition.id === selectedId);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border border-border bg-input text-text-primary hover:border-border-hover transition-colors min-w-[180px]"
      >
        {selected && (
          <>
            <LanguageChip language={selected.definition.language} />
            <span className="truncate">{selected.definition.label}</span>
          </>
        )}
        {!selected && <span className="text-text-muted">Select format…</span>}
        <ChevronDown
          size={12}
          className={`ml-auto text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 w-64 max-w-[calc(100vw-1rem)] max-h-80 overflow-auto rounded-lg border border-border bg-surface shadow-xl shadow-black/40">
          {serializers.map((s) => {
            const isActive = s.definition.id === selectedId;
            return (
              <button
                key={s.definition.id}
                onClick={() => handleSelect(s.definition.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? "bg-accent/15 text-text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                <LanguageChip language={s.definition.language} />
                <span className="text-xs truncate flex-1">
                  {s.definition.label}
                </span>
                {isActive && (
                  <Check size={12} className="text-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
