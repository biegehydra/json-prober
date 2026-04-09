"use client";

import { X } from "lucide-react";

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({
  children,
  onRemove,
  removeLabel,
  active,
  onClick,
}: ChipProps) {
  const isButton = !!onClick;
  const Tag = isButton ? "button" : "span";

  return (
    <Tag
      {...(isButton ? { type: "button" as const, onClick } : {})}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
        active
          ? "border-accent bg-accent-muted text-accent-hover font-medium"
          : isButton
            ? "border-chip-border bg-chip text-chip-text hover:text-text-primary hover:border-border-hover hover:bg-surface-hover cursor-pointer"
            : "border-chip-border bg-chip text-chip-text"
      }`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="relative -mr-1 p-1 rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </Tag>
  );
}
