"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface ResizablePanelsProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
}

export function ResizablePanels({
  left,
  right,
  defaultLeftPercent = 45,
  minLeftPercent = 20,
  maxLeftPercent = 75,
}: ResizablePanelsProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(maxLeftPercent, Math.max(minLeftPercent, pct)));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onEnd = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, minLeftPercent, maxLeftPercent]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex relative">
      {/* Left panel */}
      {!collapsed && (
        <div
          className="min-h-0 flex flex-col bg-panel"
          style={{ width: `${leftPercent}%` }}
        >
          {left}
        </div>
      )}

      {/* Drag handle + collapse button */}
      <div className="relative shrink-0 flex flex-col items-center z-10">
        {/* Vertical drag bar */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            className={`resize-handle w-1 flex-1 cursor-col-resize transition-colors ${
              dragging ? "bg-accent" : "bg-border hover:bg-border-hover"
            }`}
          />
        )}

        {/* Collapse/expand button centered on the edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-3 -translate-x-1/2 left-1/2 flex items-center justify-center w-5 h-5 rounded bg-surface border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-colors z-20"
          title={collapsed ? "Show JSON panel" : "Hide JSON panel"}
        >
          {collapsed ? (
            <PanelLeftOpen size={12} />
          ) : (
            <PanelLeftClose size={12} />
          )}
        </button>

        {collapsed && (
          <div className="w-px flex-1 bg-border" />
        )}
      </div>

      {/* Right panel */}
      <div className={`flex-1 min-h-0 flex flex-col overflow-hidden bg-panel ${collapsed ? "mx-auto max-w-5xl" : ""}`}>
        {right}
      </div>

      {/* Overlay to prevent iframe/editor stealing mouse during drag */}
      {dragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}
