import { Polygon, Tooltip } from "react-leaflet";
import type { GeoFeature } from "../../types/satquery";

const layerStyles = {
  vegetation: { color: "#4ade80", fillColor: "#22c55e", fillOpacity: 0.48, weight: 1.5 },
  water: { color: "#38bdf8", fillColor: "#0284c7", fillOpacity: 0.58, weight: 1.5 },
  built: { color: "#c084fc", fillColor: "#9333ea", fillOpacity: 0.5, weight: 1.5 },
  decrease: { color: "#f87171", fillColor: "#dc2626", fillOpacity: 0.62, weight: 1.5 },
  increase: { color: "#fbbf24", fillColor: "#d97706", fillOpacity: 0.55, weight: 1.5 },
  boundary: { color: "#67e8f9", fillColor: "#06b6d4", fillOpacity: 0.06, weight: 2, dashArray: "6, 6" },
};

interface MapLayersProps {
  activeLayerSet: Set<string>;
  features: GeoFeature[];
}

const FeaturePolygon = ({ feature }: { feature: GeoFeature }) => {
  const style = layerStyles[feature.type] || layerStyles.boundary;

  return (
    <Polygon positions={feature.coordinates} pathOptions={style}>
      <Tooltip sticky>
        <div className="map-tooltip-content">
          <strong>{feature.name}</strong>
          {feature.areaKm2 ? <div>Area: {feature.areaKm2} km²</div> : null}
          {feature.confidence ? <div>Confidence: {Math.round(feature.confidence * 100)}%</div> : null}
        </div>
      </Tooltip>
    </Polygon>
  );
};

export const MapLayers = ({ activeLayerSet, features }: MapLayersProps) => {
  const boundaryFeatures = features.filter((f) => f.type === "boundary");
  const dataFeatures = features.filter((f) => f.type !== "boundary" && activeLayerSet.has(f.type));

  return (
    <>
      {boundaryFeatures.map((feature) => (
        <FeaturePolygon key={feature.id} feature={feature} />
      ))}
      {dataFeatures.map((feature) => (
        <FeaturePolygon key={feature.id} feature={feature} />
      ))}
    </>
  );
};
