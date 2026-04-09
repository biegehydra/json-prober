"use client";

import { useCallback } from "react";
import type { Serializer } from "@/lib/serializers/types";
import { SerializerSelect } from "./SerializerSelect";

interface SerializerControlsProps {
  serializers: Serializer[];
  selectedId: string;
  onSelectId: (id: string) => void;
  options: Record<string, unknown>;
  onChangeOptions: (options: Record<string, unknown>) => void;
}

export function SerializerControls({
  serializers,
  selectedId,
  onSelectId,
  options,
  onChangeOptions,
}: SerializerControlsProps) {
  const selected = serializers.find((s) => s.definition.id === selectedId);

  const updateOption = useCallback(
    (id: string, value: unknown) => {
      onChangeOptions({ ...options, [id]: value });
    },
    [options, onChangeOptions]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-text-secondary font-medium">Code Format</span>
        <SerializerSelect
          serializers={serializers}
          selectedId={selectedId}
          onSelect={onSelectId}
        />
      </div>

      {selected && selected.definition.options.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          {selected.definition.options.map((opt) => {
            if (opt.type === "boolean") {
              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(options[opt.id] as boolean) ?? (opt.default as boolean)}
                    onChange={(e) => updateOption(opt.id, e.target.checked)}
                    className="accent-accent"
                  />
                  {opt.label}
                </label>
              );
            }
            if (opt.type === "string") {
              return (
                <div key={opt.id} className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary">{opt.label}</span>
                  <input
                    type="text"
                    value={(options[opt.id] as string) ?? (opt.default as string)}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    className="w-20 px-2 py-1 text-xs bg-input border border-border rounded text-text-primary font-mono focus:outline-none focus:border-border-focus"
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
