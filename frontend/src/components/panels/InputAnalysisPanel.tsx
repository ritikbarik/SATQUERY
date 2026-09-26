import React, { useRef, useState } from "react";
import {
  Camera,
  FileImage,
  Radio,
  RotateCcw,
  Search,
  SendHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { AnalysisMode, LocationMetadata, UploadedImageInfo } from "../../types/satquery";
import { Card } from "../common/Card";

interface InputAnalysisPanelProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  image1: UploadedImageInfo | null;
  image2: UploadedImageInfo | null;
  onImage1Change: (info: UploadedImageInfo | null) => void;
  onImage2Change: (info: UploadedImageInfo | null) => void;
  location?: LocationMetadata;
  onSearchAndCapture?: (
    placeName: string,
    targetSlot: "image1" | "image2",
    bbox?: [number, number, number, number],
    lat?: number,
    lng?: number
  ) => Promise<void>;
  onCaptureCurrentView?: (targetSlot: "image1" | "image2") => Promise<void>;
  onResetQuery?: () => void;
  isCapturingSnapshot?: boolean;
  question: string;
  onQuestionChange: (q: string) => void;
  onAnalyze: () => void;
  isProcessing: boolean;
  historicalYear?: number;
  currentYear?: number;
  onHistoricalYearChange?: (year: number) => void;
  onCurrentYearChange?: (year: number) => void;
}

const MODE_META: Record<AnalysisMode, { label: string; helper: string; icon: React.ReactNode }> = {
  single_image: {
    label: "Single Image",
    helper: "VQA, captioning, grounding",
    icon: <FileImage size={14} />,
  },
  optical_sar: {
    label: "Optical + SAR",
    helper: "joint multimodal analysis",
    icon: <Radio size={14} />,
  },
  before_after: {
    label: "Temporal Comparison",
    helper: "bi-temporal change detection",
    icon: <Sparkles size={14} />,
  },
};

export const InputAnalysisPanel: React.FC<InputAnalysisPanelProps> = ({
  mode,
  onModeChange,
  image1,
  image2,
  onImage1Change,
  onImage2Change,
  location,
  onSearchAndCapture,
  onCaptureCurrentView,
  onResetQuery,
  isCapturingSnapshot = false,
  question,
  onQuestionChange,
  onAnalyze,
  isProcessing,
  historicalYear = 2021,
  currentYear = 2026,
  onHistoricalYearChange,
  onCurrentYearChange,
}) => {
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [placeQuery, setPlaceQuery] = useState(location?.displayName || "");
  const [targetSlot, setTargetSlot] = useState<"image1" | "image2">("image1");
  const [suggestions, setSuggestions] = useState<
    Array<{ placeName: string; placeAddress: string; bbox?: [number, number, number, number]; lat?: number; lng?: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  React.useEffect(() => {
    if (location?.displayName) {
      setPlaceQuery(location.displayName);
    }
  }, [location?.displayName]);

  // Outside click listener for suggestion dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (val: string) => {
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const resp = await fetch(`/api/autosuggest?q=${encodeURIComponent(val)}&limit=6`);
      if (resp.ok) {
        const data = await resp.json();
        const list = data.suggestions || [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handlePlaceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setPlaceQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 260);
  };

  const handleSelectSuggestion = (s: {
    placeName: string;
    placeAddress: string;
    bbox?: [number, number, number, number];
    lat?: number;
    lng?: number;
  }) => {
    const fullName = s.placeAddress ? `${s.placeName}, ${s.placeAddress}` : s.placeName;
    setPlaceQuery(s.placeName);
    setShowSuggestions(false);
    onSearchAndCapture?.(fullName, targetSlot, s.bbox, s.lat, s.lng);
  };

  const handleFile = (file: File, slot: "image1" | "image2") => {
    const info: UploadedImageInfo = {
      file,
      previewUrl: URL.createObjectURL(file),
      filename: file.name,
      format: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
      notes: ["User uploaded raster/image file."],
    };
    slot === "image1" ? onImage1Change(info) : onImage2Change(info);
  };

  const submitCapture = (event: React.FormEvent) => {
    event.preventDefault();
    if (placeQuery.trim()) {
      setShowSuggestions(false);
      onSearchAndCapture?.(placeQuery.trim(), targetSlot);
    }
  };

  const requiredSecondLabel = mode === "before_after" ? "T2 image" : "SAR image";
  const canAnalyze = Boolean(image1 || placeQuery.trim()) && question.trim().length > 0;

  return (
    <Card title="SatQuery Input" icon={<Search size={16} />} className="sih-input-card">
      <div className="sih-panel-body">
        <section className="sih-section">
          <div className="sih-label-row">
            <span>Agent Workflow</span>
            <strong>{MODE_META[mode].helper}</strong>
          </div>
          <div className="sih-mode-grid">
            {(Object.keys(MODE_META) as AnalysisMode[]).map((key) => (
              <button
                type="button"
                key={key}
                className={`sih-mode-btn ${mode === key ? "active" : ""}`}
                onClick={() => {
                  onModeChange(key);
                  setTargetSlot("image1");
                }}
              >
                {MODE_META[key].icon}
                <span>{MODE_META[key].label}</span>
              </button>
            ))}
          </div>

          {/* Temporal Comparison Controls (Section 29 of masterprompt.md) */}
          {mode === "before_after" && (
            <div className="temporal-controls-row">
              <div className="temporal-field">
                <label>Historical (T1)</label>
                <select
                  value={historicalYear}
                  onChange={(e) => onHistoricalYearChange?.(Number(e.target.value))}
                  className="temporal-select"
                >
                  {[2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                    <option key={y} value={y}>
                      {y} (T1 Baseline)
                    </option>
                  ))}
                </select>
              </div>
              <div className="temporal-field">
                <label>Current (T2)</label>
                <select
                  value={currentYear}
                  onChange={(e) => onCurrentYearChange?.(Number(e.target.value))}
                  className="temporal-select"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y} (T2 Current)
                    </option>
                  ))}
                </select>
              </div>
              <div className="temporal-hint" style={{ gridColumn: "span 2" }}>
                <span>💡 Comparing satellite rasters from {historicalYear} to {currentYear}.</span>
              </div>
            </div>
          )}
        </section>

        <section className="sih-section">
          <div className="sih-label-row">
            <span>Capture From Map</span>
            {mode !== "single_image" && (
              <div className="sih-segmented">
                <button
                  type="button"
                  className={targetSlot === "image1" ? "active" : ""}
                  onClick={() => setTargetSlot("image1")}
                >
                  Image 1
                </button>
                <button
                  type="button"
                  className={targetSlot === "image2" ? "active" : ""}
                  onClick={() => setTargetSlot("image2")}
                >
                  Image 2
                </button>
              </div>
            )}
          </div>

          <div className="sih-capture-wrapper" ref={suggestionsRef} style={{ position: "relative" }}>
            <form className="sih-capture-form" onSubmit={submitCapture}>
              <Search size={14} />
              <input
                value={placeQuery}
                onChange={handlePlaceInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search city, e.g. Cuttack, Bhubaneswar, Indore"
                disabled={isCapturingSnapshot}
              />
              <button type="submit" disabled={isCapturingSnapshot || !placeQuery.trim()} title="Capture satellite image">
                {isCapturingSnapshot ? <span className="spinner-micro" /> : <Camera size={14} />}
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="sih-suggestions-dropdown"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 1500,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                  marginTop: "4px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sih-suggestion-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <strong style={{ fontSize: "12px", color: "var(--text)" }}>{s.placeName}</strong>
                    <small style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                      {s.placeAddress}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sih-capture-actions">
            <button
              type="button"
              className="sih-capture-view-btn"
              onClick={() => onCaptureCurrentView?.(targetSlot)}
              disabled={isCapturingSnapshot}
              title="Capture screenshot of whatever map area is currently zoomed into"
            >
              {isCapturingSnapshot ? <span className="spinner-micro" /> : <Camera size={14} />}
              <span>{isCapturingSnapshot ? "Capturing View..." : "Capture View"}</span>
            </button>
          </div>
        </section>

        <section className="sih-section">
          <div className="sih-label-row">
            <span>Imagery</span>
            <strong>GeoTIFF, TIFF, PNG, JPG</strong>
          </div>

          <input
            ref={file1Ref}
            type="file"
            accept=".tif,.tiff,.png,.jpg,.jpeg"
            hidden
            onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0], "image1")}
          />
          <input
            ref={file2Ref}
            type="file"
            accept=".tif,.tiff,.png,.jpg,.jpeg"
            hidden
            onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0], "image2")}
          />

          <div className="sih-image-slots">
            <ImageSlot
              label={mode === "before_after" ? "T1 baseline" : "Primary image"}
              image={image1}
              onUpload={() => file1Ref.current?.click()}
              onClear={() => onImage1Change(null)}
            />
            {mode !== "single_image" && (
              <ImageSlot
                label={requiredSecondLabel}
                image={image2}
                onUpload={() => file2Ref.current?.click()}
                onClear={() => onImage2Change(null)}
              />
            )}
          </div>
        </section>

        <section className="sih-section">
          <div className="sih-label-row">
            <span>Natural-Language Query</span>
            {onResetQuery && (
              <button
                type="button"
                className="sih-reset-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
                onClick={onResetQuery}
                title="Clear current query, images, and results"
              >
                <RotateCcw size={11} />
                <span>Reset Query</span>
              </button>
            )}
          </div>
          <textarea
            value={question}
            onChange={(event) => {
              const val = event.target.value;
              onQuestionChange(val);
              if (/last\s*5\s*years|\b5\s*years\b|\b5-year\b/i.test(val)) {
                if (mode !== "before_after") onModeChange("before_after");
                if (onHistoricalYearChange) onHistoricalYearChange(currentYear - 5);
              }
            }}
            placeholder="Ask a remote-sensing question, e.g. identify water bodies, count houses, describe land cover, or detect change."
            rows={4}
            className="sih-question"
          />
        </section>

        <button
          type="button"
          className="sih-run-btn"
          disabled={isProcessing || isCapturingSnapshot || !canAnalyze}
          onClick={onAnalyze}
        >
          {isProcessing ? <RotateCcw size={15} className="spin" /> : <SendHorizontal size={15} />}
          <span>{isProcessing ? "Running Agent Workflow" : "Run SatQuery Analysis"}</span>
        </button>
      </div>
    </Card>
  );
};

const ImageSlot = ({
  label,
  image,
  onUpload,
  onClear,
}: {
  label: string;
  image: UploadedImageInfo | null;
  onUpload: () => void;
  onClear: () => void;
}) => (
  <div className="sih-image-slot">
    <div className="sih-image-slot-head">
      <span>{label}</span>
      {image && (
        <button type="button" onClick={onClear} title="Remove image">
          <Trash2 size={12} />
        </button>
      )}
    </div>
    {image ? (
      <div className="sih-image-ready">
        <img src={image.previewUrl} alt={label} />
        <div>
          <strong title={image.filename}>{image.filename}</strong>
          <span>{image.format || "IMAGE"}</span>
          {image.bounds && <small>Geo-boundary attached</small>}
        </div>
      </div>
    ) : (
      <button type="button" className="sih-upload-btn" onClick={onUpload}>
        <UploadCloud size={16} />
        <span>Upload</span>
      </button>
    )}
  </div>
);
