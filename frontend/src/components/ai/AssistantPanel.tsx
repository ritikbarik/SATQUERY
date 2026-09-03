import React from "react";
import { Sparkles, Bot, Satellite, CheckCircle2 } from "lucide-react";
import type { LocationMetadata, QueryIntent } from "../../types/satquery";
import { TextHighlighter } from "../common/TextHighlighter";
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
              <Sparkles size={11} /> Agent Active
            </span>
          </div>
          <p className="assistant-sub">
            Multispectral satellite synthesis &amp; live telemetry across {locName}
          </p>
        </div>

        <div className="assistant-telemetry-badge">
          <CheckCircle2 size={13} className="telemetry-ok" />
          <span>Copernicus &amp; BigEarthNet Ready</span>
        </div>
      </div>

      {/* Main content row */}
      <div className="assistant-content-row">
        {/* Answer area */}
        <div className="answer-card-wrapper">
          <div className="answer-card-label">
            <Satellite size={12} />
            <span>AI Satellite Synthesis</span>
          </div>
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
            💡 <em>Click any highlighted metric or place to run immediate geospatial scans.</em>
          </div>
        </div>

        {/* Suggested queries */}
        <div className="suggested-queries-wrapper">
          <div className="suggested-label">Recommended Queries ({locName})</div>
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
