import React, { useEffect, useRef, useState } from "react";
import { Sparkles, CloudSun, Droplets, Leaf, Search } from "lucide-react";

interface TextHighlighterProps {
  text: string;
  highlights?: string[];
  onActionClick?: (query: string) => void;
  className?: string;
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  highlights = [],
  onActionClick,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: "", x: 0, y: 0 });

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 2) {
        setSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if selection is within our container
      if (containerRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        setSelectionBox({
          visible: true,
          text: selectedText,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 42,
        });
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Split text into tokens and highlight key terms, percentages, numbers, years, and highlight array
  const renderHighlightedContent = () => {
    if (!text) return null;

    // Build regex pattern from highlights and numeric patterns
    const terms = highlights
      .filter(Boolean)
      .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    // Standard highlighters for numbers with %, units, or years
    const regexPattern = terms.length > 0
      ? `(${terms.join("|")}|[-+]?\\d+(?:\\.\\d+)?(?:%|°C|\\s*km²|\\s*km)?|\\b20\\d{2}\\b)`
      : `([-+]?\\d+(?:\\.\\d+)?(?:%|°C|\\s*km²|\\s*km)?|\\b20\\d{2}\\b)`;

    const regex = new RegExp(regexPattern, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase()) ||
        /^[-+]?\d+(\.\d+)?(%|°C|\s*km²|\s*km)?$/i.test(part.trim()) ||
        /^\b20\d{2}\b$/.test(part.trim());

      if (isMatch) {
        return (
          <mark
            key={index}
            className="highlight-chip"
            title="Click to query this keyword"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.(`Show satellite intelligence for ${part}`);
            }}
          >
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div ref={containerRef} className={`text-highlighter-wrapper ${className}`}>
      <div className="highlighter-body">{renderHighlightedContent()}</div>

      {selectionBox.visible && onActionClick && (
        <div
          className="floating-selection-toolbar"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
          <div className="selection-badge">
            <Sparkles size={13} className="sparkle-icon" />
            <span>"{selectionBox.text.slice(0, 18)}{selectionBox.text.length > 18 ? "..." : ""}"</span>
          </div>
          <button
            className="selection-btn"
            onClick={() => {
              onActionClick(`Search this area: ${selectionBox.text}`);
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }}
            title="Search this area"
          >
            <Search size={13} />
            <span>Search this area</span>
          </button>
          <button
            className="selection-btn"
            onClick={() => {
              onActionClick(`Analyze NDVI vegetation for ${selectionBox.text}`);
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }}
            title="Analyze NDVI"
          >
            <Leaf size={13} />
            <span>Analyze NDVI</span>
          </button>
          <button
            className="selection-btn"
            onClick={() => {
              onActionClick(`Check weather and soil moisture for ${selectionBox.text}`);
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }}
            title="Check Weather"
          >
            <CloudSun size={13} />
            <span>Check Weather</span>
          </button>
          <button
            className="selection-btn"
            onClick={() => {
              onActionClick(`Analyze water bodies near ${selectionBox.text}`);
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }}
            title="Analyze Water"
          >
            <Droplets size={13} />
            <span>Analyze Water</span>
          </button>
          <button
            className="selection-btn"
            onClick={() => {
              onActionClick(`Show ${selectionBox.text} on map`);
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }}
            title="Show on Map"
          >
            <Search size={13} />
            <span>Show on Map</span>
          </button>
        </div>
      )}
    </div>
  );
};
