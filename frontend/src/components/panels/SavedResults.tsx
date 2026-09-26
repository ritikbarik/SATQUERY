import React, { useEffect, useState } from "react";
import { Bookmark, FileDown, Printer, Star, Trash2 } from "lucide-react";
import { Card } from "../common/Card";

interface SavedItem {
  id: string;
  title: string;
  location: string;
  savedAt: string;
  intent: string;
  question?: string;
  answer?: string;
  metrics?: {
    ndvi?: number;
    ndwi?: number;
    ndbi?: number;
    confidence?: number;
  };
}

const DEMO_SAVED: SavedItem[] = [
  {
    id: "s1",
    title: "Vegetation Loss Analysis – Odisha",
    location: "Odisha, India",
    savedAt: "24 Aug 2026",
    intent: "vegetation-loss",
    question: "Analyze vegetation cover loss and forest canopy dynamics in Odisha",
    answer: "Multi-sensor analysis observed a 3.4% localized canopy thinning in northern forest corridors, with active regeneration in coastal mangrove zones.",
    metrics: { ndvi: 0.612, ndwi: 0.284, ndbi: 0.142, confidence: 93 },
  },
  {
    id: "s2",
    title: "Chilika Lake Water Bodies",
    location: "Chilika, Odisha",
    savedAt: "23 Aug 2026",
    intent: "water-bodies",
    question: "Find and delineate surface water bodies in Chilika Lake lagoon",
    answer: "Extracted 1,165 km² of active open water expanse across northern and southern sectors, showing seasonal inflow stabilization.",
    metrics: { ndvi: 0.218, ndwi: 0.587, ndbi: 0.089, confidence: 96 },
  },
  {
    id: "s3",
    title: "Bengaluru Urban Expansion",
    location: "Bengaluru, Karnataka",
    savedAt: "22 Aug 2026",
    intent: "construction-growth",
    question: "Detect new building footprints and urban sprawl in Bengaluru periphery",
    answer: "Dense impervious surface clustering detected in eastern technology corridors, with substantial construction footprint growth.",
    metrics: { ndvi: 0.345, ndwi: 0.112, ndbi: 0.418, confidence: 91 },
  },
];

const intentColor: Record<string, string> = {
  "vegetation-loss": "#ff6470",
  "water-bodies": "#39b8ff",
  "construction-growth": "#b66cff",
  "satellite-analysis": "#10b981",
  ndvi: "#88f36d",
  weather: "#ffd84d",
};

interface SavedResultsProps {
  onSelectQuery?: (queryText: string) => void;
}

export const SavedResults: React.FC<SavedResultsProps> = ({ onSelectQuery }) => {
  const [items, setItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem("satquery_saved_queries");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEMO_SAVED;
  });

  // Keep in sync with other components saving queries
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem("satquery_saved_queries");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("satquery_queries_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("satquery_queries_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const remove = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem("satquery_saved_queries", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const exportPdf = (item: SavedItem) => {
    const printWindow = window.open("", "_blank", "width=880,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    const narrative = item.answer || item.question || item.title;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>SatQuery Saved Dossier - ${item.title}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.6; padding: 24px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { font-size: 22px; font-weight: 800; color: #1e3a8a; }
          .sub { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .summary { background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin: 18px 0; border-radius: 0 8px 8px 0; }
          .meta-row { display: flex; gap: 16px; margin-bottom: 14px; font-size: 13px; color: #475569; }
          .metrics-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
          .metrics-table th, .metrics-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          .metrics-table th { background: #f1f5f9; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">🛰️ SATQUERY AI · SAVED REPORT</div>
            <div class="sub">Geospatial Intelligence Dossier</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <div><strong>Saved At:</strong> ${item.savedAt}</div>
            <div><strong>Location:</strong> ${item.location}</div>
          </div>
        </div>
        <div class="meta-row">
          <div><strong>Query:</strong> ${item.question || item.title}</div>
        </div>
        <div class="summary">
          <strong style="color: #1e3a8a; display: block; margin-bottom: 6px;">ANALYSIS SUMMARY</strong>
          <div>${narrative}</div>
        </div>
        ${item.metrics ? `
          <h3>Telemetry Snapshot</h3>
          <table class="metrics-table">
            <tr><th>Metric</th><th>Recorded Value</th></tr>
            <tr><td>NDVI (Vegetation)</td><td>${item.metrics.ndvi ?? "N/A"}</td></tr>
            <tr><td>NDWI (Water)</td><td>${item.metrics.ndwi ?? "N/A"}</td></tr>
            <tr><td>NDBI (Built-up)</td><td>${item.metrics.ndbi ?? "N/A"}</td></tr>
            <tr><td>Confidence</td><td>${item.metrics.confidence ? `${item.metrics.confidence}%` : "94%"}</td></tr>
          </table>
        ` : ""}
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };<\/script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportMarkdown = (item: SavedItem) => {
    const text = `# SatQuery Saved Analysis: ${item.title}
Location: ${item.location}
Saved Date: ${item.savedAt}

## Query
${item.question || item.title}

## Findings
${item.answer || "No narrative recorded"}

## Metrics
- NDVI: ${item.metrics?.ndvi ?? "N/A"}
- NDWI: ${item.metrics?.ndwi ?? "N/A"}
- NDBI: ${item.metrics?.ndbi ?? "N/A"}
- Confidence: ${item.metrics?.confidence ? `${item.metrics.confidence}%` : "94%"}

Generated by SatQuery AI
`;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SatQuery_Saved_${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="SAVED QUERIES & REPORTS" icon={<Star size={18} />} className="saved-card">
      {items.length === 0 ? (
        <div className="saved-empty">
          <Bookmark size={32} className="muted" />
          <p className="muted">No saved queries yet. Run a query and click "Save Query" to keep it here.</p>
        </div>
      ) : (
        <div className="saved-list">
          {items.map((item) => (
            <div key={item.id} className="saved-item">
              <span
                className="saved-dot"
                style={{ background: intentColor[item.intent] ?? "#10b981" }}
              />
              <div
                className="saved-info"
                style={{ cursor: onSelectQuery ? "pointer" : "default" }}
                onClick={() => onSelectQuery?.(item.question || item.title)}
                title="Click to load query into workspace"
              >
                <strong>{item.title}</strong>
                <small>
                  {item.location} · {item.savedAt}
                </small>
              </div>
              <div className="saved-actions" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  className="icon-button-sm"
                  title="Save / Print as PDF Report"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportPdf(item);
                  }}
                >
                  <Printer size={14} />
                </button>
                <button
                  className="icon-button-sm"
                  title="Export Markdown Report (.md)"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportMarkdown(item);
                  }}
                >
                  <FileDown size={14} />
                </button>
                <button
                  className="icon-button-sm danger"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(item.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
