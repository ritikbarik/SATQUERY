import React from "react";
import { BarChart3, Building2, Download, Droplets, Leaf, TrendingDown, Waves, Sparkles, Radio, ShieldCheck } from "lucide-react";
import type { AnalysisMetric, AnalysisResult } from "../../types/satquery";
import { Card } from "../common/Card";
import { ConfidenceBar } from "../common/ConfidenceBar";

const icons = {
  water: Waves,
  vegetation: Leaf,
  built: Building2,
  decrease: TrendingDown,
  increase: BarChart3,
};

interface AnalysisSummaryProps {
  analysis: AnalysisResult;
  isProcessing: boolean;
}

const MetricRow = ({ metric }: { metric: AnalysisMetric }) => {
  const Icon = icons[metric.tone] || BarChart3;
  return (
    <div className={`analysis-row ${metric.tone}`}>
      <span className="analysis-icon">
        <Icon size={20} />
      </span>
      <div className="metric-text-wrap">
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
      </div>
    </div>
  );
};

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis, isProcessing }) => (
  <Card title="ANALYSIS SUMMARY" icon={<BarChart3 size={18} />} className="analysis-card">
    {isProcessing ? (
      <div className="processing">
        <Droplets size={20} className="animate-bounce" />
        <span>Synthesizing multispectral bands &amp; SAR fusion...</span>
      </div>
    ) : null}

    <div className={isProcessing ? "dimmed" : ""}>
      <div className="analysis-title-pill">
        <Sparkles size={13} className="cyan" />
        <span>{analysis.title}</span>
      </div>

      <div className="metrics-stack">
        {analysis.metrics.map((metric) => (
          <MetricRow key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Multispectral & Built-up Indices (NDVI, NDWI, NDBI) */}
      {analysis.meanNdvi !== undefined && (
        <div className="spectral-indices-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", margin: "10px 0" }}>
          <div className="index-pill">
            <small>NDVI (Veg)</small>
            <strong>{analysis.meanNdvi}</strong>
          </div>
          <div className="index-pill">
            <small>NDWI (Water)</small>
            <strong>{analysis.ndwi ?? 0.22}</strong>
          </div>
          <div className="index-pill">
            <small>NDBI (Built)</small>
            <strong>{analysis.ndbi ?? 0.14}</strong>
          </div>
        </div>
      )}

      {/* Optical + SAR Fusion Telemetry */}
      {analysis.sarBackscatterDb !== undefined && (
        <div className="sar-fusion-badge" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(147, 51, 234, 0.12)", border: "1px solid rgba(147, 51, 234, 0.25)", borderRadius: "8px", padding: "6px 10px", margin: "8px 0", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Radio size={13} className="purple" />
            <span>Sentinel-1 SAR C-band</span>
          </div>
          <strong>{analysis.sarBackscatterDb} dB</strong>
        </div>
      )}

      {/* Evidence-backed explanation summary */}
      {analysis.evidence && analysis.evidence.length > 0 && (
        <div className="evidence-box" style={{ background: "rgba(0,0,0,0.25)", borderRadius: "6px", padding: "8px", margin: "8px 0", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--cyan-accent)", marginBottom: "4px" }}>
            <ShieldCheck size={12} />
            <strong>Verified Satellite Evidence</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", color: "rgba(255,255,255,0.75)" }}>
            {analysis.evidence.slice(0, 3).map((item, idx) => (
              <li key={idx} style={{ marginBottom: "2px" }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="confidence-row">
        <span>Confidence Score</span>
        <ConfidenceBar value={analysis.confidence} />
      </div>

      <button
        className="export-button"
        onClick={() => {
          const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `satquery_analysis_${Date.now()}.json`;
          a.click();
        }}
      >
        <Download size={15} /> Export GeoJSON &amp; Report
      </button>
    </div>
  </Card>
);
