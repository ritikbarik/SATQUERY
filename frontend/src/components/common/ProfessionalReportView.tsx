import React from "react";
import { Activity, Layers, MapPin, Radio, Satellite, ShieldCheck, Sparkles } from "lucide-react";

interface ProfessionalReportViewProps {
  text: string;
  className?: string;
}

interface ParsedSection {
  title?: string;
  icon?: React.ReactNode;
  metrics: Array<{ label: string; value: string }>;
  paragraphs: string[];
}

export const ProfessionalReportView: React.FC<ProfessionalReportViewProps> = ({ text, className = "" }) => {
  if (!text) return null;

  // 1. Sanitize raw markdown characters (** and -)
  const cleanLine = (l: string): string => {
    return l
      .replace(/\*\*/g, "") // remove bold markers
      .replace(/\*/g, "") // remove single asterisks
      .replace(/^#{1,6}\s*/, "") // remove markdown heading hashes
      .replace(/^[-•*]\s+/, "") // remove leading dash bullet or bullet point
      .replace(/^\d+\.\s+/, "") // remove leading numbered list prefix like 1.
      .trim();
  };

  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter((l) => l.length > 0);

  // 2. Parse into structured sections, key-value metrics, and narrative paragraphs
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = {
    metrics: [],
    paragraphs: [],
  };

  const isSectionHeader = (line: string): boolean => {
    return (
      /^(geographic coordinates|target location|joint optical|optical satellite|synthetic aperture|cross-modal|bi-temporal|remote-sensing scene|satellite intelligence|spectral land-cover|baseline scene|recent telemetry)/i.test(line) ||
      (line.endsWith(":") && line.split(":").length === 2 && line.length < 60)
    );
  };

  const getSectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("geographic") || t.includes("coordinate") || t.includes("location") || t.includes("target")) return <MapPin size={13} className="text-emerald" />;
    if (t.includes("optical") || t.includes("reflectance")) return <Satellite size={13} className="text-emerald" />;
    if (t.includes("sar") || t.includes("radar")) return <Radio size={13} className="text-amber" />;
    if (t.includes("cross-modal") || t.includes("synergy")) return <Layers size={13} className="text-cyan" />;
    if (t.includes("change") || t.includes("bi-temporal")) return <Activity size={13} className="text-purple" />;
    return <Sparkles size={13} className="text-sage" />;
  };

  for (const line of lines) {
    if (isSectionHeader(line)) {
      if (currentSection.title || currentSection.metrics.length > 0 || currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }
      const titleClean = line.endsWith(":") ? line.slice(0, -1) : line;
      currentSection = {
        title: titleClean,
        icon: getSectionIcon(titleClean),
        metrics: [],
        paragraphs: [],
      };
      continue;
    }

    // Check for Key: Value format
    const colonIndex = line.indexOf(":");
    if (colonIndex > 2 && colonIndex < 45) {
      const label = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      // Ensure it's a metric/attribute rather than a regular sentence
      if (value.length > 0 && value.length < 120) {
        currentSection.metrics.push({ label, value });
        continue;
      }
    }

    // Otherwise narrative text
    currentSection.paragraphs.push(line);
  }

  if (currentSection.title || currentSection.metrics.length > 0 || currentSection.paragraphs.length > 0) {
    sections.push(currentSection);
  }

  // Value badge tone helper
  const getValueBadgeClass = (val: string): string => {
    const v = val.toLowerCase();
    if (v.includes("° n") || v.includes("° e") || v.includes("° s") || v.includes("° w") || v.includes("meters")) return "metric-badge-cyan";
    if (v.includes("verified") || v.includes("high") || v.includes("%") || v.includes("ndvi")) return "metric-badge-green";
    if (v.includes("sar") || v.includes("db") || v.includes("radar")) return "metric-badge-amber";
    if (v.includes("optical") || v.includes("coherence") || v.includes("synergy")) return "metric-badge-cyan";
    return "metric-badge-default";
  };

  return (
    <div className={`professional-report-container ${className}`}>
      {sections.map((sec, sIdx) => (
        <div key={sIdx} className="report-section-block">
          {sec.title && (
            <div className="report-section-header">
              {sec.icon || <ShieldCheck size={13} />}
              <h4>{sec.title}</h4>
            </div>
          )}

          {/* Key-Value Metrics Grid */}
          {sec.metrics.length > 0 && (
            <div className="report-metrics-grid">
              {sec.metrics.map((m, mIdx) => (
                <div key={mIdx} className="report-metric-row">
                  <span className="metric-label">{m.label}</span>
                  <span className={`metric-value-pill ${getValueBadgeClass(m.value)}`}>{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Narrative Paragraphs */}
          {sec.paragraphs.map((p, pIdx) => (
            <p key={pIdx} className="report-paragraph-lead">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};
