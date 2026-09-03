import React from "react";
import { Sparkles, Bot } from "lucide-react";
import type { LocationMetadata, QueryIntent } from "../../types/satquery";
import { TextHighlighter } from "../common/TextHighlighter";
import { QueryInput } from "./QueryInput";
import { SuggestedQueries } from "./SuggestedQueries";

interface AssistantPanelProps {
  input: string;
  setInput: (value: string) => void;
  suggestions: Array<{ text: string; intent: QueryIntent }>;
  isProcessing: boolean;
  error: string | null;
  answer: string;
  highlights: string[];
  location?: LocationMetadata;
  onSelectSuggestion: (query: string) => void;
  onSubmit: (customQuery?: string) => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  input,
  setInput,
  suggestions,
  isProcessing,
  error,
  answer,
  highlights,
  location,
  onSelectSuggestion,
  onSubmit,
}) => {
  const locName = location?.regionName || "India";

  return (
    <section className="assistant-panel glass-card">
      {/* Header */}
      <div className="assistant-header-card">
        <div className="assistant-avatar">
          <Bot size={18} className="bot-icon" />
        </div>
        <div className="assistant-header-info">
          <div className="assistant-title-row">
            <strong>SatQuery Intelligence AI</strong>
            <span className="ai-badge">
              <Sparkles size={10} /> Active
            </span>
          </div>
          <p className="assistant-sub">
            Multispectral satellite analysis &amp; live telemetry across {locName}
          </p>
        </div>

        {/* Query input inside the header row on the right */}
        <div style={{ marginLeft: "auto", flexShrink: 0, width: "340px" }}>
          <QueryInput
            value={input}
            onChange={setInput}
            onSubmit={() => onSubmit()}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Main content row */}
      <div className="assistant-content-row">
        {/* Answer area */}
        <div className="answer-card-wrapper">
          <div className="answer-card-label">AI Satellite Synthesis</div>
          {error ? (
            <p className="error-state">{error}</p>
          ) : (
            <TextHighlighter
              text={answer}
              highlights={highlights}
              onActionClick={(q) => onSubmit(q)}
              className="answer-highlighter"
            />
          )}
          <div className="highlight-hint">
            💡 <em>Tip: Select or click any highlighted text to scan the satellite map or check weather.</em>
          </div>
        </div>

        {/* Suggested queries */}
        <div className="suggested-queries-wrapper">
          <div className="suggested-label">Recommended ({locName})</div>
          <SuggestedQueries
            queries={suggestions}
            onSelect={onSelectSuggestion}
            disabled={isProcessing}
          />
        </div>
      </div>

      <p className="disclaimer">
        SatQuery AI integrates Copernicus Sentinel-1 SAR &amp; Sentinel-2 telemetry, BigEarthNet Earth Observation VQA dataset, and Open-Meteo live API.
      </p>
    </section>
  );
};
