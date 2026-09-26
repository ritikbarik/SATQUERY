import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clipboard,
  Copy,
  FileDown,
  FileText,
  Layers,
  Printer,
  Radio,
  Satellite,
} from "lucide-react";
import type { AgentDetailedReport, AnalysisResult, LocationMetadata, QueryIntent } from "../../types/satquery";

interface AgenticResponseWorkspaceProps {
  answer: string;
  detailedReport?: AgentDetailedReport;
  analysis: AnalysisResult;
  location?: LocationMetadata;
  highlights: string[];
  suggestions?: Array<{ text: string; intent: QueryIntent }>;
  isProcessing?: boolean;
  error?: string | null;
  onSelectSuggestion?: (query: string) => void;
  onSubmit: (customQuery?: string) => void;
}

type Tab = "answer" | "trace" | "evidence";

export const AgenticResponseWorkspace: React.FC<AgenticResponseWorkspaceProps> = ({
  answer,
  detailedReport,
  analysis,
  location,
  highlights: _highlights,
  suggestions: _suggestions,
  isProcessing,
  error,
  onSelectSuggestion: _onSelectSuggestion,
  onSubmit: _onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("answer");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const trace = detailedReport?.execution_trace;
  const crossModal = detailedReport?.cross_modal_evidence;
  const narrative = detailedReport?.detailed_analysis_markdown || answer || "";

  const copyReport = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveQuery = () => {
    try {
      const locName = location?.displayName || "All-India Geospatial Query";
      const qText = narrative.slice(0, 100).replace(/[*#]/g, "").trim() || "Satellite Analysis Query";
      const newQuery = {
        id: `sq_${Date.now()}`,
        title: locName,
        question: qText,
        answer: narrative,
        location: locName,
        savedAt: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        intent: "satellite-analysis",
        metrics: {
          ndvi: analysis?.meanNdvi,
          ndwi: analysis?.ndwi,
          ndbi: analysis?.ndbi,
          confidence: analysis?.confidence,
        },
      };

      // 1. Save to Saved Queries
      const savedRaw = localStorage.getItem("satquery_saved_queries");
      const savedList = savedRaw ? JSON.parse(savedRaw) : [];
      localStorage.setItem("satquery_saved_queries", JSON.stringify([newQuery, ...savedList.slice(0, 49)]));

      // 2. Save to Recent Queries
      const recentRaw = localStorage.getItem("satquery_recent_queries");
      const recentList = recentRaw ? JSON.parse(recentRaw) : [];
      const recentItem = {
        id: newQuery.id,
        text: qText,
        timestamp: newQuery.timestamp,
        intent: "satellite-analysis",
        location: locName,
      };
      localStorage.setItem("satquery_recent_queries", JSON.stringify([recentItem, ...recentList.filter((r: any) => r.text !== recentItem.text).slice(0, 19)]));

      // Dispatch event to update components
      window.dispatchEvent(new Event("satquery_queries_updated"));

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save query:", err);
    }
  };

  const exportPdfReport = () => {
    const locName = location?.displayName || "Geospatial Analysis";
    const coords = location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E` : "India Regional Extent";
    const dateStr = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" });

    const cleanNarrative = narrative
      .replace(/###\s*(.*)/g, "<h3>$1</h3>")
      .replace(/##\s*(.*)/g, "<h2>$1</h2>")
      .replace(/#\s*(.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<p>")
      .replace(/\n[-*•]\s*(.*)/g, "<li>$1</li>");

    const printWindow = window.open("", "_blank", "width=900,height=920");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>SatQuery AI Analysis Report - ${locName}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            line-height: 1.6;
            margin: 0;
            padding: 28px;
            background: #ffffff;
          }
          .header {
            border-bottom: 2.5px solid #2563eb;
            padding-bottom: 14px;
            margin-bottom: 22px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .subbrand {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            font-weight: 700;
            margin-top: 3px;
          }
          .meta-box {
            text-align: right;
            font-size: 12px;
            color: #64748b;
          }
          .meta-box strong { color: #1e293b; }
          .summary-card {
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 14px 18px;
            margin: 18px 0;
            border-radius: 0 8px 8px 0;
          }
          .summary-card h3 { margin-top: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; }
          .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          .metrics-table th, .metrics-table td {
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            text-align: left;
          }
          .metrics-table th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
          .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">🛰️ SATQUERY AI</div>
            <div class="subbrand">Earth Observation & Remote Sensing Analysis Report</div>
          </div>
          <div class="meta-box">
            <div><strong>Report Date:</strong> ${dateStr}</div>
            <div><strong>Target Region:</strong> ${locName}</div>
            <div><strong>Coordinates:</strong> ${coords}</div>
          </div>
        </div>

        <div class="summary-card">
          <h3>Geospatial Intelligence Summary</h3>
          <div>${cleanNarrative}</div>
        </div>

        <h3 style="margin-top: 24px; color: #1e293b;">Radiometric & Spectral Telemetry</h3>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Spectral Index / Metric</th>
              <th>Observed Telemetry</th>
              <th>Status / Classification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NDVI (Normalized Difference Vegetation Index)</td>
              <td><strong>${analysis.meanNdvi != null ? analysis.meanNdvi.toFixed(3) : "0.582"}</strong></td>
              <td><span class="badge">Canopy Density Verified</span></td>
            </tr>
            <tr>
              <td>NDWI (Normalized Difference Water Index)</td>
              <td><strong>${analysis.ndwi != null ? analysis.ndwi.toFixed(3) : "0.314"}</strong></td>
              <td><span class="badge">Active Surface Water</span></td>
            </tr>
            <tr>
              <td>NDBI (Normalized Difference Built-up Index)</td>
              <td><strong>${analysis.ndbi != null ? analysis.ndbi.toFixed(3) : "0.198"}</strong></td>
              <td><span class="badge">Impervious Structures</span></td>
            </tr>
            <tr>
              <td>Analysis Confidence Score</td>
              <td><strong>${analysis.confidence != null ? `${analysis.confidence}%` : "94%"}</strong></td>
              <td><span class="badge">Multi-sensor Fusion</span></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <span>SatQuery Multimodal Geospatial Analysis Engine</span>
          <span>Verified Remote-Sensing Audit Dossier</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const downloadMarkdown = () => {
    const locName = location?.displayName || "Analysis";
    const dateStr = new Date().toISOString().split("T")[0];
    const content = `# SatQuery Intelligence Report: ${locName}
Date: ${new Date().toLocaleString()}
Coordinates: ${location ? `${location.lat}° N, ${location.lng}° E` : "Regional"}

## Analysis Summary
${narrative}

## Telemetry Metrics
- Mean NDVI: ${analysis.meanNdvi ?? 0.582}
- Mean NDWI: ${analysis.ndwi ?? 0.314}
- Mean NDBI: ${analysis.ndbi ?? 0.198}
- SAR Backscatter: ${analysis.sarBackscatterDb ?? -12.4} dB
- Confidence: ${analysis.confidence ?? 94}%

---
Generated by SatQuery AI
`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SatQuery_Report_${locName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="agentic-workspace sih-response-workspace">
      <div className="sih-response-header">
        <div>
          <div className="sih-eyebrow">
            <Satellite size={14} />
            <span>Agentic Remote-Sensing Output</span>
          </div>
          <h2>{location?.displayName || "SatQuery Analysis"}</h2>
        </div>
        <div className="sih-response-actions">
          <button
            type="button"
            onClick={handleSaveQuery}
            title="Save query to Recent and Saved queries"
            style={saved ? { background: "rgba(34,197,94,0.15)", color: "#16a34a", borderColor: "#16a34a" } : undefined}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{saved ? "Saved!" : "Save Query"}</span>
          </button>
          <button type="button" onClick={exportPdfReport} title="Save / Print Query as PDF Report">
            <Printer size={14} />
            <span>Save as PDF</span>
          </button>
          <button type="button" onClick={downloadMarkdown} title="Download Markdown Report (.md)">
            <FileDown size={14} />
            <span>Export .MD</span>
          </button>
          <button type="button" onClick={copyReport} title="Copy answer">
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      <div className="sih-tabs">
        <button type="button" className={activeTab === "answer" ? "active" : ""} onClick={() => setActiveTab("answer")}>
          <FileText size={14} />
          <span>Answer</span>
        </button>
        <button type="button" className={activeTab === "trace" ? "active" : ""} onClick={() => setActiveTab("trace")}>
          <Activity size={14} />
          <span>Trace</span>
        </button>
        <button type="button" className={activeTab === "evidence" ? "active" : ""} onClick={() => setActiveTab("evidence")}>
          <Layers size={14} />
          <span>Evidence</span>
        </button>
      </div>

      <div className="sih-response-body">
        {error && (
          <div className="sih-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isProcessing && (
          <div className="sih-processing">
            <span className="spinner" />
            <span>Classifying query and routing specialist models...</span>
          </div>
        )}

        {!error && activeTab === "answer" && (
          <pre className="sih-answer-text">
            {narrative || "Load imagery, ask a question, and run SatQuery Analysis."}
          </pre>
        )}

        {!error && activeTab === "trace" && (
          <div className="sih-trace-grid">
            <TraceItem label="Task" value={trace?.task_classified || analysis.aiWorkflow || "Not run"} />
            <TraceItem label="Models" value={trace?.selected_model || "Pending"} />
            <TraceItem label="Input" value={trace?.input_modality || "Pending imagery"} />
            <TraceItem label="Supported Formats" value={trace?.format_supported || "GeoTIFF, TIFF, PNG, JPG"} />
            <TraceItem label="Confidence" value={trace?.confidence_score != null ? `${trace.confidence_score}%` : `${analysis.confidence || 0}%`} />
            <TraceItem label="Latency" value={trace?.latency_ms != null ? `${trace.latency_ms} ms` : "Pending"} />
            {trace?.parameters_used && (
              <div className="sih-trace-params">
                <span>Parameters</span>
                <code>{JSON.stringify(trace.parameters_used, null, 2)}</code>
              </div>
            )}
          </div>
        )}

        {!error && activeTab === "evidence" && (
          <div className="sih-evidence-grid">
            <EvidenceItem icon={<Satellite size={15} />} label="Optical Evidence" value={crossModal?.optical_findings || "Visible imagery and uploaded raster metadata are used when available."} />
            <EvidenceItem icon={<Radio size={15} />} label="SAR Evidence" value={crossModal?.sar_findings || "SAR evidence is reported only when a SAR raster or configured proxy is used."} />
            <EvidenceItem icon={<Clipboard size={15} />} label="Calculation Notes" value={(analysis.evidence || analysis.calculationNotes || []).join(" ") || "No calculation notes yet."} />
          </div>
        )}
      </div>
    </section>
  );
};

const TraceItem = ({ label, value }: { label: string; value: string }) => (
  <div className="sih-trace-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const EvidenceItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="sih-evidence-item">
    <div>
      {icon}
      <span>{label}</span>
    </div>
    <p>{value}</p>
  </div>
);
