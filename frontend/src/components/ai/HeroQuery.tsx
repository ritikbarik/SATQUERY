import React from "react";
import { Mic, Search, SendHorizontal, Sparkles } from "lucide-react";

interface HeroQueryProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (customQuery?: string) => void;
  isProcessing: boolean;
  suggestions?: Array<{ text: string; intent: string }>;
  onSelectSuggestion?: (query: string) => void;
}

const DEFAULT_QUICK_TAGS = [
  { label: "💧 Water Bodies", query: "Find water bodies near Chilika lake" },
  { label: "🌿 Vegetation Loss", query: "Show vegetation loss between 2024 and 2026" },
  { label: "🏗️ Urban Growth", query: "Where has construction increased in Bengaluru?" },
  { label: "📊 NDVI Canopy", query: "Compute NDVI canopy health for Odisha, India" },
  { label: "🛰️ BigEarthNet VQA", query: "What is the dominant land cover in Austria patch?" },
];

export const HeroQuery: React.FC<HeroQueryProps> = ({
  value,
  onChange,
  onSubmit,
  isProcessing,
  suggestions = [],
  onSelectSuggestion,
}) => {
  const handleTagClick = (q: string) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(q);
    } else {
      onChange(q);
      onSubmit(q);
    }
  };

  return (
    <div className="hero-query-container">
      <div className="hero-query-wrapper">
        <div className="hero-query-glow" />
        
        {/* Main interactive search box */}
        <form
          className="hero-query"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onSubmit(value);
          }}
        >
          <div className="hero-query-prefix" title="SatQuery AI Agent Engine">
            <Sparkles size={20} className="sparkle-pulse" />
          </div>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ask SatQuery AI anything about Earth Observation, satellite indices, or Indian geography..."
            aria-label="Ask SatQuery AI"
            disabled={isProcessing}
          />

          <div className="hero-query-actions">
            <button
              type="button"
              className="hero-mic-btn"
              aria-label="Use microphone"
              title="Voice Input (Speech-to-Text)"
              onClick={() => {
                if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
                  // @ts-ignore
                  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                  const rec = new SpeechRec();
                  rec.lang = "en-IN";
                  rec.onresult = (evt: any) => {
                    const transcript = evt.results[0][0].transcript;
                    onChange(transcript);
                    onSubmit(transcript);
                  };
                  rec.start();
                } else {
                  onChange("Show vegetation loss in Odisha between 2024 and 2026");
                }
              }}
            >
              <Mic size={18} />
            </button>

            <button
              type="submit"
              className="hero-send-btn"
              aria-label="Send query"
              disabled={isProcessing || !value.trim()}
              title="Run Satellite Intelligence Query"
            >
              {isProcessing ? <span className="spinner" /> : <SendHorizontal size={20} />}
            </button>
          </div>
        </form>

        {/* Quick-action interactive suggestion chips right in the middle */}
        <div className="hero-query-chips">
          <span className="hero-chips-label">
            <Search size={12} />
            <span>Popular:</span>
          </span>
          {suggestions.length > 0
            ? suggestions.slice(0, 4).map((s) => (
                <button
                  key={s.text}
                  type="button"
                  className="hero-chip-pill"
                  onClick={() => handleTagClick(s.text)}
                  disabled={isProcessing}
                >
                  {s.text.length > 28 ? s.text.slice(0, 26) + "..." : s.text}
                </button>
              ))
            : DEFAULT_QUICK_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  className="hero-chip-pill"
                  onClick={() => handleTagClick(tag.query)}
                  disabled={isProcessing}
                >
                  {tag.label}
                </button>
              ))}
        </div>
      </div>
    </div>
  );
};
