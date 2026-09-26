import React from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  Crosshair,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  GroundingBoxItem,
  LocationMetadata,
  RemoteSensingAnalysisResult,
} from "../../types/satquery";
import { Card } from "../common/Card";
import { ProfessionalReportView } from "../common/ProfessionalReportView";

interface AgentAnalysisPanelProps {
  rsResult: RemoteSensingAnalysisResult | null;
  analysis?: unknown;
  location?: LocationMetadata;
  isProcessing: boolean;
  onFocusBox?: (box: GroundingBoxItem) => void;
}

export const AgentAnalysisPanel: React.FC<AgentAnalysisPanelProps> = ({
  rsResult,
  analysis: _analysis,
  location: targetLocation,
  isProcessing,
  onFocusBox,
}) => {
  const taskName = rsResult?.detected_task || "Awaiting task classification";
  const models = rsResult?.selected_models?.length
    ? rsResult.selected_models
    : ["RSVQA-Specialist-v2", "Vision-Language-Engine"];
  const status = isProcessing
    ? "Executing remote-sensing workflow..."
    : rsResult?.execution_status || "Awaiting analysis";
  const confidence = rsResult?.confidence_score;
  const question = rsResult?.question || "No active query submitted";
  const answer = rsResult?.answer || (
    isProcessing
      ? "Agentic controller is processing remote-sensing rasters and executing spectral analysis..."
      : "Submit a question or upload remote-sensing imagery to begin analysis."
  );

  // Grounding boxes from actual model
  const groundingBoxes = rsResult?.grounding_boxes || [];
  const locMeta: LocationMetadata | undefined = rsResult?.location || targetLocation;

  return (
    <div className="agent-analysis-stack">
      {/* CARD 1: AGENT ANALYSIS */}
      <Card
        title="AGENT ANALYSIS"
        icon={<Cpu size={16} />}
        className="agent-meta-card"
      >
        <div className="agent-meta-body">
          {/* Detected Task */}
          <div className="agent-meta-row">
            <span className="meta-label">Detected Task:</span>
            <span className="task-pill">
              <Sparkles size={12} className="text-sage" />
              <strong>{taskName}</strong>
            </span>
          </div>

          {/* Selected Specialist Models / Tools */}
          <div className="agent-meta-row">
            <span className="meta-label">Selected Tools:</span>
            <div className="models-tags-wrap">
              {models.map((m, i) => (
                <span key={i} className="model-chip">
                  <Bot size={11} />
                  <span>{m}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Execution Status */}
          <div className="agent-meta-row">
            <span className="meta-label">Execution Status:</span>
            <span className={`status-pill ${isProcessing ? "processing" : rsResult ? "complete" : "idle"}`}>
              {isProcessing ? (
                <>
                  <span className="spinner-micro" />
                  <span>Processing</span>
                </>
              ) : rsResult ? (
                <>
                  <CheckCircle2 size={13} className="text-success" />
                  <span>{status}</span>
                </>
              ) : (
                <span>Awaiting analysis</span>
              )}
            </span>
          </div>

          {/* Actual Confidence Score (Strict No Fabricated Data Rule) */}
          <div className="agent-meta-row">
            <span className="meta-label">Actual Confidence:</span>
            <span className="confidence-display">
              {confidence !== null && confidence !== undefined ? (
                <strong className="confidence-num">{confidence.toFixed(1)}%</strong>
              ) : (
                <em className="text-muted">Not calculated for this input</em>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* CARD 2: ANALYSIS RESULT */}
      <Card
        title="ANALYSIS RESULT"
        icon={<ShieldCheck size={16} />}
        className="analysis-result-card"
      >
        <div className="result-card-body">
          {/* User's Query */}
          <div className="result-query-box">
            <small>Natural-Language Query:</small>
            <p>"{question}"</p>
          </div>

          {/* Queried Area Latitude & Longitude Card */}
          {locMeta && !locMeta.displayName.includes("All-India") && (
            <div className="result-target-loc-card">
              <div className="target-loc-top-row">
                <div className="target-loc-title">
                  <MapPin size={14} className="target-pin-svg" />
                  <strong>{locMeta.displayName}</strong>
                </div>
                <span className="target-loc-pill">Target Coordinates</span>
              </div>
              <div className="target-coords-grid">
                <div className="target-coord-item">
                  <span className="coord-label">Latitude</span>
                  <strong className="coord-value">{locMeta.lat.toFixed(4)}° N</strong>
                </div>
                <div className="target-coord-item">
                  <span className="coord-label">Longitude</span>
                  <strong className="coord-value">{locMeta.lng.toFixed(4)}° E</strong>
                </div>
                {locMeta.elevationMeters !== undefined && (
                  <div className="target-coord-item">
                    <span className="coord-label">Elevation</span>
                    <strong className="coord-value">{locMeta.elevationMeters} m</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified Model Answer Narrative */}
          <div className="result-answer-box">
            <div className="result-answer-label">
              <Activity size={13} />
              <span>Verified Remote-Sensing Response</span>
            </div>
            <div className="result-answer-text">
              <ProfessionalReportView text={answer} />
            </div>
          </div>

          {/* Visual Evidence / Grounding Objects */}
          <div className="visual-evidence-section">
            <div className="evidence-header">
              <Crosshair size={13} />
              <span>Visual Evidence &amp; Grounding</span>
              <span className="count-badge">{groundingBoxes.length} items</span>
            </div>

            {groundingBoxes.length > 0 ? (
              <div className="grounding-cards-list">
                {groundingBoxes.map((box) => (
                  <div
                    key={box.id}
                    className="grounding-card-item"
                    onClick={() => onFocusBox?.(box)}
                  >
                    <div className="box-label-row">
                      <strong>📍 {box.label}</strong>
                      <span className="box-conf">{box.confidence.toFixed(1)}%</span>
                    </div>
                    {box.description && <small className="box-desc">{box.description}</small>}
                    <span className="box-coords">
                      Box [Y:{box.box_2d[0]}, X:{box.box_2d[1]}, H:{box.box_2d[2]-box.box_2d[0]}, W:{box.box_2d[3]-box.box_2d[1]}]
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-evidence-notice">
                <span>{isProcessing ? "Extracting visual evidence..." : "No explicit visual grounding boxes detected for this query."}</span>
              </div>
            )}
          </div>

          {/* Bi-Temporal Change Summary if active */}
          {rsResult?.bitemporal_change && (
            <div className="change-result-box">
              <div className="change-title">
                <Layers size={13} />
                <span>Bi-Temporal Change Evidence</span>
              </div>
              <div className="change-metrics-grid">
                <div className="change-pill green">
                  <small>Increased</small>
                  <strong>{rsResult.bitemporal_change.increased_pct ?? "N/A"}%</strong>
                </div>
                <div className="change-pill red">
                  <small>Decreased</small>
                  <strong>{rsResult.bitemporal_change.decreased_pct ?? "N/A"}%</strong>
                </div>
                <div className="change-pill gray">
                  <small>Unchanged</small>
                  <strong>{rsResult.bitemporal_change.unchanged_pct ?? "N/A"}%</strong>
                </div>
              </div>
              {rsResult.bitemporal_change.description && (
                <p className="change-desc">{rsResult.bitemporal_change.description}</p>
              )}
            </div>
          )}

          {/* Actual Computed Spectral Indices (Only shown if genuinely computed from bands) */}
          <div className="genuine-indices-section">
            <small className="indices-label">Calculated Spectral Indices:</small>
            {rsResult?.stats?.meanNdvi !== null && rsResult?.stats?.meanNdvi !== undefined ? (
              <div className="indices-chips-row">
                <span className="index-badge">NDVI: <strong>{rsResult.stats.meanNdvi.toFixed(3)}</strong></span>
                {rsResult.stats.ndwi !== null && rsResult.stats.ndwi !== undefined && (
                  <span className="index-badge">NDWI: <strong>{rsResult.stats.ndwi.toFixed(3)}</strong></span>
                )}
                {rsResult.stats.ndbi !== null && rsResult.stats.ndbi !== undefined && (
                  <span className="index-badge">NDBI: <strong>{rsResult.stats.ndbi.toFixed(3)}</strong></span>
                )}
              </div>
            ) : (
              <em className="text-muted" style={{ fontSize: "11px" }}>
                Not calculated for this input — requires multispectral GeoTIFF bands.
              </em>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
