import React from "react";
import { BarChart3, Building2, Droplets, Leaf, MapPin, Mountain, ScanLine, Layers } from "lucide-react";
import { Card } from "../common/Card";
import type { AnalysisResult, LocationMetadata } from "../../types/satquery";

interface AreaInformationProps {
  location?: LocationMetadata;
  analysis?: AnalysisResult;
}

const spark = (tone: string) => (
  <svg viewBox="0 0 86 24" className="spark" aria-hidden="true">
    <path d="M2 20 L16 15 L27 18 L43 9 L58 15 L73 10 L84 8" className={tone} />
  </svg>
);

export const AreaInformation: React.FC<AreaInformationProps> = ({ location, analysis }) => {
  const locName = location?.displayName || "Punjab, India";
  const areaDisplay = location?.areaKm2 ? `${location.areaKm2.toLocaleString()} km²` : "50,362 km²";
  const coordsDisplay = location?.coordinatesDisplay || "31.1471° N, 75.3412° E";
  const elevationDisplay = location?.elevationMeters ? `${location.elevationMeters} m` : "240 m";

  // Find metrics from current analysis
  const vegMetric = analysis?.metrics.find((m) => m.label.includes("Vegetation Cover"))?.value || "68.2%";
  const waterMetric = analysis?.metrics.find((m) => m.label.includes("Water Bodies"))?.value || "31 detected";
  const builtMetric = analysis?.metrics.find((m) => m.label.includes("Built-up Area"))?.value || "14.8%";
  const ndbiMetric = analysis?.ndbi !== undefined ? `${analysis.ndbi}` : "-0.05";

  return (
    <Card title="AREA INFORMATION" icon={<ScanLine size={18} />} className="area-card">
      <div className="info-list">
        <div className="info-row">
          <MapPin size={16} className="green info-icon" />
          <span className="info-label">Location</span>
          <strong className="info-value truncate-val" title={locName}>
            {locName}
          </strong>
        </div>

        <div className="info-row">
          <ScanLine size={16} className="cyan info-icon" />
          <span className="info-label">Area Extent</span>
          <strong className="info-value">{areaDisplay}</strong>
        </div>

        <div className="info-row">
          <BarChart3 size={16} className="purple info-icon" />
          <span className="info-label">Coordinates</span>
          <strong className="info-value text-xs">{coordsDisplay}</strong>
        </div>

        <div className="metric info-row">
          <Leaf size={16} className="green info-icon" />
          <span className="info-label">Vegetation Cover</span>
          <strong className="info-value">{vegMetric}</strong>
          {spark("green-stroke")}
        </div>

        <div className="metric info-row">
          <Droplets size={16} className="cyan info-icon" />
          <span className="info-label">Water Bodies</span>
          <strong className="info-value">{waterMetric}</strong>
          {spark("cyan-stroke")}
        </div>

        <div className="metric info-row">
          <Building2 size={16} className="purple info-icon" />
          <span className="info-label">Built-up Area</span>
          <strong className="info-value">{builtMetric}</strong>
          {spark("purple-stroke")}
        </div>

        <div className="info-row">
          <Layers size={16} className="cyan info-icon" />
          <span className="info-label">NDBI (Built-up)</span>
          <strong className="info-value">{ndbiMetric}</strong>
        </div>

        <div className="info-row">
          <Mountain size={16} className="muted info-icon" />
          <span className="info-label">Mean Elevation</span>
          <strong className="info-value">{elevationDisplay}</strong>
        </div>
      </div>

      <div className="area-card-footer">
        <div className="state-badge">Region: {location?.state || "National"}</div>
      </div>
    </Card>
  );
};
