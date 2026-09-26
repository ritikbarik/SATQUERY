import React, { useEffect, useRef, useState } from "react";
import { Mic, Search, SendHorizontal, Sparkles, X } from "lucide-react";

interface MapplsSuggestion {
  placeName: string;
  placeAddress: string;
  type?: string;
}

interface HeroQueryProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (customQuery?: string) => void;
  isProcessing: boolean;
  suggestions?: Array<{ text: string; intent: string }>;
  onSelectSuggestion?: (query: string) => void;
}

export const HeroQuery: React.FC<HeroQueryProps> = ({
  value,
  onChange,
  onSubmit,
  isProcessing,
  onSelectSuggestion,
}) => {
  const [autoSuggestions, setAutoSuggestions] = useState<MapplsSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ----- Mappls Autosuggest via backend proxy (handles CORS + auth) -----
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setAutoSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      // Use the backend geocode proxy which calls Nominatim with correct auth
      const resp = await fetch(
        `/api/autosuggest?q=${encodeURIComponent(query)}&limit=6`
      );
      if (resp.ok) {
        const data = await resp.json();
        const results: MapplsSuggestion[] = (data.suggestions || []).map(
          (s: any) => ({
            placeName: s.placeName || s.name || query,
            placeAddress: s.placeAddress || s.address || "",
          })
        );
        setAutoSuggestions(results);
        setShowSuggestions(results.length > 0);
      }
    } catch {
      setAutoSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce input
  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 320);
  };

  const handleSuggestionSelect = (s: MapplsSuggestion) => {
    const query = `Analyze satellite imagery and land cover for ${s.placeName}${s.placeAddress ? `, ${s.placeAddress.split(",")[0]}` : ""}`;
    setShowSuggestions(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(query);
    } else {
      onChange(query);
      onSubmit(query);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="hero-query-container" ref={wrapperRef}>
      <div className="hero-query-wrapper">
        <div className="hero-query-glow" />

        {/* Main interactive search box */}
        <form
          className="hero-query"
          onSubmit={(e) => {
            e.preventDefault();
            setShowSuggestions(false);
            if (value.trim()) onSubmit(value);
          }}
        >
          <div className="hero-query-prefix" title="SatQuery AI Agent Engine">
            <Sparkles size={20} className="sparkle-pulse" />
          </div>

          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (autoSuggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search any place in India — e.g. Guwahati, Wayanad, Chilika, Bhopal, Surat..."
            aria-label="Search places across India"
            disabled={isProcessing}
            autoComplete="off"
          />

          <div className="hero-query-actions">
            {value && (
              <button
                type="button"
                className="hero-mic-btn"
                aria-label="Clear input"
                title="Clear"
                onClick={() => {
                  onChange("");
                  setAutoSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                <X size={15} />
              </button>
            )}

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

        {/* Mappls / Nominatim autosuggest dropdown */}
        {showSuggestions && autoSuggestions.length > 0 && (
          <div className="hero-autosuggest-dropdown">
            <div className="hero-autosuggest-header">
              <Search size={11} />
              <span>Places in India</span>
            </div>
            {autoSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="hero-autosuggest-item"
                onClick={() => handleSuggestionSelect(s)}
              >
                <div className="hero-autosuggest-name">📍 {s.placeName}</div>
                {s.placeAddress && (
                  <div className="hero-autosuggest-address">{s.placeAddress}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
