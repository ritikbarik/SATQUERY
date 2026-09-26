import React, { useEffect, useRef, useState } from "react";
import { Crosshair, Eye, Map as MapIcon, Mountain, Shield } from "lucide-react";
import L, { type Map as LeafletMap } from "leaflet";
import { CircleMarker, GeoJSON, ImageOverlay, MapContainer, Marker, Polygon, Popup, Rectangle, TileLayer, Tooltip, useMap } from "react-leaflet";
import { MapLayers } from "./MapLayers";
import { MapToolbar } from "./MapToolbar";
import type {
  BuildingDetectionItem,
  GeoFeature,
  GeographicAnalysisBoundary,
  GroundingBoxItem,
  LocationMetadata,
  WaterBodyPolygon,
} from "../../types/satquery";

interface SatelliteMapProps {
  location?: LocationMetadata;
  activeLayerSet: Set<string>;
  features: GeoFeature[];
  isProcessing: boolean;
  imageBounds?: [number, number, number, number] | null;
  imagePreviewUrl?: string | null;
  groundingBoxes?: GroundingBoxItem[];
  waterPolygons?: WaterBodyPolygon[];
  detectedBuildings?: BuildingDetectionItem[];
  analysisBoundary?: GeographicAnalysisBoundary | null;
  focusedBoxId?: string | null;
  onLayerToggle?: (layer: "vegetation" | "water" | "built" | "decrease" | "increase") => void;
  onSnapshot?: (mapEl: HTMLElement | null, location?: LocationMetadata, customQuery?: string, customAnalysis?: any, openDrawer?: boolean) => void;
  onMapReady?: (map: LeafletMap) => void;
}

type TileProvider = "mappls" | "terrain" | "sentinel";

const TILE_PROVIDERS: Record<TileProvider, { name: string; url: string; attribution: string; maxZoom: number }> = {
  mappls: {
    name: "Mappls Satellite (India)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Mappls | MapmyIndia &copy; ISRO Bhuvan",
    maxZoom: 19,
  },
  terrain: {
    name: "Mappls Topo Terrain",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Mappls | MapmyIndia &copy; Survey of India",
    maxZoom: 19,
  },
  sentinel: {
    name: "Sentinel-2 Multispectral",
    url: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
    attribution: "Sentinel-2 Cloudless EO",
    maxZoom: 18,
  },
};

// Reference boundary & place labels overlay
const REFERENCE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

// Custom high-contrast location target pin marker with sharp needle tip pointing precisely at city center
const queryTargetPinIcon = L.divIcon({
  className: "target-city-center-pin-wrap",
  html: `
    <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); pointer-events:auto; cursor:pointer;">
      <div style="
        background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #0284C7 100%);
        color: #FFFFFF;
        font-weight: 700;
        font-size: 11px;
        padding: 3px 9px;
        border-radius: 999px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 12px rgba(37,99,235,0.65);
        border: 2px solid #FFFFFF;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span style="font-size:12px;">📍</span>
        <span>City Center</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 10px solid #1D4ED8;
        margin-top: -1px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
      "></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -42],
});

// Numbered pin icon pointing directly at an identified house / building
const createHousePinIcon = (rank: number) =>
  L.divIcon({
    className: "house-marker-pin-wrap",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); cursor:pointer;">
        <div style="background:linear-gradient(135deg, #EA580C, #C2410C); color:#ffffff; font-weight:800; font-size:11px; padding:2px 7px; border-radius:999px; box-shadow:0 2px 8px rgba(0,0,0,0.5); border:1.5px solid #FFFFFF; display:flex; align-items:center; gap:3px; white-space:nowrap;">
          <span>🏠</span>
          <span>${rank}</span>
        </div>
        <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #C2410C;"></div>
      </div>
    `,
    iconSize: [40, 28],
    iconAnchor: [20, 28],
    popupAnchor: [0, -30],
  });

// Numbered pin icon pointing directly at an identified water body
const createWaterPinIcon = (rank: number) =>
  L.divIcon({
    className: "water-marker-pin-wrap",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); cursor:pointer;">
        <div style="background:linear-gradient(135deg, #0284C7, #0369A1); color:#ffffff; font-weight:800; font-size:11px; padding:2px 7px; border-radius:999px; box-shadow:0 2px 8px rgba(0,0,0,0.5); border:1.5px solid #FFFFFF; display:flex; align-items:center; gap:3px; white-space:nowrap;">
          <span>💧</span>
          <span>${rank}</span>
        </div>
        <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #0369A1;"></div>
      </div>
    `,
    iconSize: [40, 28],
    iconAnchor: [20, 28],
    popupAnchor: [0, -30],
  });

// Map controller to smoothly fly to new coordinates with auto deep-zoom when searching
const MapViewController = ({
  location,
  boundaryGeoJson,
  groundingBoxes,
  imageBounds,
  focusedBoxId,
  analysisBoundary,
}: {
  location?: LocationMetadata;
  boundaryGeoJson?: any;
  groundingBoxes?: GroundingBoxItem[];
  imageBounds?: [number, number, number, number] | null;
  focusedBoxId?: string | null;
  analysisBoundary?: GeographicAnalysisBoundary | null;
}) => {
  const map = useMap();

  useEffect(() => {
    // 1. Focus on specific detected grounding box if selected
    if (focusedBoxId && groundingBoxes && groundingBoxes.length > 0) {
      const targetBox = groundingBoxes.find((b) => b.id === focusedBoxId);
      if (targetBox) {
        const bounds = imageBounds || (location?.boundingBox as [number, number, number, number] | undefined) || (
          location ? [location.lat - 0.015, location.lat + 0.015, location.lng - 0.02, location.lng + 0.02] : undefined
        );
        if (bounds) {
          const [south, north, west, east] = bounds;
          const [ymin, xmin, ymax, xmax] = targetBox.box_2d;
          const latMin = north - (ymax / 1000) * (north - south);
          const latMax = north - (ymin / 1000) * (north - south);
          const lngMin = west + (xmin / 1000) * (east - west);
          const lngMax = west + (xmax / 1000) * (east - west);
          map.flyToBounds([[latMin, lngMin], [latMax, lngMax]], { padding: [60, 60], duration: 1.2 });
          return;
        }
      }
    }

    // 2. If calibrated analysis boundary is active, fly to calibrated bounds
    if (analysisBoundary?.leaflet_bounds) {
      map.flyToBounds(analysisBoundary.leaflet_bounds, { padding: [40, 40], duration: 1.2 });
      return;
    }

    // 3. If real boundary outline GeoJSON exists for a state/large region, fit to its authentic borders
    if (boundaryGeoJson?.geometry && location?.areaKm2 && location.areaKm2 > 3000) {
      try {
        const layer = L.geoJSON(boundaryGeoJson);
        const b = layer.getBounds();
        if (b.isValid()) {
          map.flyToBounds(b, { padding: [35, 35], duration: 1.2 });
          return;
        }
      } catch {
        // Fallback to location coordinates
      }
    }

    // 4. Urban city center zoom: zoom straight in on the city center
    if (location?.lat && location?.lng) {
      const isOverview = location.displayName.includes("All-India") || location.areaKm2 > 2000000;
      if (isOverview) {
        map.flyTo([22.5, 82.0], 5, { duration: 1.0 });
      } else {
        const deepZoom = location.areaKm2 < 1000 ? 15 : 13;
        map.flyTo([location.lat, location.lng], deepZoom, { duration: 1.3, easeLinearity: 0.25 });
      }
    }
  }, [location?.lat, location?.lng, location?.displayName, location?.areaKm2, boundaryGeoJson, focusedBoxId, analysisBoundary, map]);

  return null;
};

const MapReadyHandler = ({ onMapReady }: { onMapReady?: (map: LeafletMap) => void }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
};

export const SatelliteMap = ({
  location,
  activeLayerSet,
  features,
  isProcessing,
  imageBounds,
  imagePreviewUrl,
  groundingBoxes,
  waterPolygons,
  detectedBuildings,
  analysisBoundary,
  focusedBoxId,
  onSnapshot,
  onMapReady,
}: SatelliteMapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Authentic Administrative Border Boundary (GeoJSON Polygon/MultiPolygon) ──
  const [boundaryGeoJson, setBoundaryGeoJson] = useState<any>(null);

  useEffect(() => {
    if (!location || location.displayName.includes("All-India")) {
      setBoundaryGeoJson(null);
      return;
    }

    let cancelled = false;
    const targetPlace = location.regionName || location.state || location.displayName.split(",")[0].trim();

    fetch(`/api/boundary?q=${encodeURIComponent(targetPlace)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.geometry) {
          setBoundaryGeoJson(data);
        } else if (!cancelled) {
          if (location.state && location.state !== targetPlace) {
            fetch(`/api/boundary?q=${encodeURIComponent(location.state)}`)
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((d2) => {
                if (!cancelled && d2 && d2.geometry) {
                  setBoundaryGeoJson(d2);
                } else if (!cancelled) {
                  setBoundaryGeoJson(null);
                }
              })
              .catch(() => {
                if (!cancelled) setBoundaryGeoJson(null);
              });
          } else {
            setBoundaryGeoJson(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setBoundaryGeoJson(null);
      });

    return () => {
      cancelled = true;
    };
  }, [location?.displayName, location?.regionName, location?.state]);

  const [tileProvider, setTileProvider] = useState<TileProvider>("mappls");
  const [showPlaceLabels, setShowPlaceLabels] = useState(true);

  const centerLat = location?.lat ?? 20.5937;
  const centerLng = location?.lng ?? 78.9629;

  const resetToAllIndia = () => mapRef.current?.flyTo([22.5, 82.0], 5, { duration: 1.0 });
  const resetToLocation = () => {
    if (location) {
      const isOverview = location.displayName.includes("All-India") || location.areaKm2 > 2000000;
      mapRef.current?.flyTo([location.lat, location.lng], isOverview ? 5 : 15, { duration: 0.8 });
    }
  };

  const handleSnapshotClick = () => {
    if (onSnapshot) {
      onSnapshot(mapContainerRef.current, location, undefined, undefined, true);
    }
  };

  const currentProvider = TILE_PROVIDERS[tileProvider];

  // Derive bounding box for grounding features
  const effectiveBounds = imageBounds || (location?.boundingBox as [number, number, number, number] | undefined) || (
    location ? [location.lat - 0.015, location.lat + 0.015, location.lng - 0.02, location.lng + 0.02] : undefined
  );

  return (
    <section
      className="map-shell"
      id="satquery-map-element"
      ref={mapContainerRef}
    >
      {/* Leaflet Map */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={location && !location.displayName.includes("All-India") ? 15 : 5}
        minZoom={4}
        maxZoom={19}
        zoomControl={false}
        className="satellite-map"
        ref={mapRef}
      >
        <MapReadyHandler onMapReady={onMapReady} />

        {/* Primary Tile Layer */}
        <TileLayer
          key={tileProvider}
          attribution={currentProvider.attribution}
          url={currentProvider.url}
          maxZoom={currentProvider.maxZoom}
          crossOrigin="anonymous"
        />

        {/* Place labels overlay */}
        {showPlaceLabels && (
          <TileLayer
            key="mappls-labels"
            url={REFERENCE_LABELS_URL}
            maxZoom={19}
            opacity={0.85}
            crossOrigin="anonymous"
          />
        )}

        <MapViewController
          location={location}
          boundaryGeoJson={boundaryGeoJson}
          groundingBoxes={groundingBoxes}
          imageBounds={imageBounds}
          focusedBoxId={focusedBoxId}
          analysisBoundary={analysisBoundary}
        />
        <MapLayers activeLayerSet={activeLayerSet} features={features} />

        {/* Uploaded Image Footprint & Overlay */}
        {imageBounds && (
          <>
            <Rectangle
              bounds={[[imageBounds[0], imageBounds[2]], [imageBounds[1], imageBounds[3]]]}
              pathOptions={{ color: "#2E7D5B", weight: 2, fillOpacity: 0.15 }}
            />
            {imagePreviewUrl && (
              <ImageOverlay
                url={imagePreviewUrl}
                bounds={[[imageBounds[0], imageBounds[2]], [imageBounds[1], imageBounds[3]]]}
                opacity={0.85}
              />
            )}
          </>
        )}

        {/* GEOGRAPHIC ANALYSIS BOUNDARY */}
        {analysisBoundary?.leaflet_bounds && (
          <Rectangle
            bounds={analysisBoundary.leaflet_bounds}
            pathOptions={{
              color: "#10B981",
              weight: 2,
              fillColor: "#10B981",
              fillOpacity: 0.04,
              dashArray: "6, 6",
            }}
          >
            <Tooltip direction="bottom" permanent className="analysis-boundary-tooltip">
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "rgba(255,255,255,0.9)", padding: "2px 6px", borderRadius: "4px" }}>
                🎯 Geographic Analysis Boundary (Zoom {analysisBoundary.zoom || 16})
              </div>
            </Tooltip>
          </Rectangle>
        )}

        {/* GENUINE WATER BODY POLYGONS (GEOJSON / LEAFLET) */}
        {waterPolygons && waterPolygons.length > 0 && waterPolygons.map((w, idx) => (
          <React.Fragment key={w.id}>
            <Polygon
              positions={w.leaflet_coordinates}
              pathOptions={{
                color: "#0284C7",
                weight: 2.2,
                fillColor: "#38BDF8",
                fillOpacity: 0.42,
              }}
            >
              <Tooltip direction="top" className="grounding-map-tooltip">
                <div className="grounding-tooltip-card">
                  <span className="grounding-dot" style={{ background: "#0284C7" }} />
                  <strong>💧 {w.name}</strong>
                  <span className="grounding-conf-pill">
                    {w.area_m2 >= 10000 ? `${w.area_km2.toFixed(3)} km²` : `${Math.round(w.area_m2)} m²`}
                  </span>
                </div>
              </Tooltip>
              <Popup>
                <div style={{ padding: "6px", minWidth: "160px" }}>
                  <h4 style={{ margin: "0 0 4px 0", color: "#0369A1", fontSize: "13px" }}>💧 {w.name}</h4>
                  <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div>Type: <strong>{w.type}</strong></div>
                    <div>Surface Area: <strong>{w.area_m2.toLocaleString()} m² ({w.area_km2} km²)</strong></div>
                    <div>Confidence: <strong>{w.confidence}%</strong></div>
                  </div>
                </div>
              </Popup>
            </Polygon>
            {w.centroid && (
              <>
                <CircleMarker
                  center={[w.centroid[0], w.centroid[1]]}
                  radius={4}
                  pathOptions={{ color: "#0369A1", fillColor: "#E0F2FE", fillOpacity: 0.9, weight: 1.5 }}
                />
                <Marker position={[w.centroid[0], w.centroid[1]]} icon={createWaterPinIcon(idx + 1)}>
                  <Tooltip direction="top" className="grounding-map-tooltip">
                    <div className="grounding-tooltip-card">
                      <span className="grounding-dot" style={{ background: "#0284C7" }} />
                      <strong>💧 #{idx + 1} {w.name}</strong>
                      <span className="grounding-conf-pill">
                        {w.area_m2 >= 10000 ? `${w.area_km2.toFixed(3)} km²` : `${Math.round(w.area_m2)} m²`}
                      </span>
                    </div>
                  </Tooltip>
                </Marker>
              </>
            )}
          </React.Fragment>
        ))}

        {/* DETECTED BUILDING FOOTPRINT BOUNDING BOXES & POINTING PINS */}
        {detectedBuildings && detectedBuildings.length > 0 && detectedBuildings.map((b, idx) => {
          const rank = idx + 1;
          const boundsToUse = b.geo_bounds?.leaflet_bounds || (b.center_latlng && b.center_latlng.length === 2 ? [
            [b.center_latlng[0] - 0.0001, b.center_latlng[1] - 0.0001] as [number, number],
            [b.center_latlng[0] + 0.0001, b.center_latlng[1] + 0.0001] as [number, number],
          ] : null);

          const centerPos: [number, number] | null = b.center_latlng && b.center_latlng.length === 2
            ? [b.center_latlng[0], b.center_latlng[1]]
            : (boundsToUse ? [(boundsToUse[0][0] + boundsToUse[1][0]) / 2, (boundsToUse[0][1] + boundsToUse[1][1]) / 2] : null);

          if (!boundsToUse || !centerPos) return null;

          return (
            <React.Fragment key={b.id}>
              {/* Highlighted Building Rooftop Footprint */}
              <Rectangle
                bounds={boundsToUse}
                pathOptions={{
                  color: "#EA580C",
                  weight: 2.2,
                  fillColor: "#FB923C",
                  fillOpacity: 0.42,
                }}
              />

              {/* Numbered Pin Pointing Directly at House */}
              <Marker position={centerPos} icon={createHousePinIcon(rank)}>
                <Tooltip direction="top" className="grounding-map-tooltip">
                  <div className="grounding-tooltip-card">
                    <span className="grounding-dot" style={{ background: "#EA580C" }} />
                    <strong>🏠 House #{rank}</strong>
                    <span className="grounding-conf-pill">{b.area_m2 != null ? `${b.area_m2.toFixed(0)} m²` : "N/A"}</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ padding: "6px", minWidth: "150px" }}>
                    <h4 style={{ margin: "0 0 4px 0", color: "#C2410C", fontSize: "13px" }}>🏠 House #{rank}</h4>
                    <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div>Footprint: <strong>{b.area_m2 != null ? `${b.area_m2.toFixed(0)} m²` : "N/A"}</strong></div>
                      <div>Confidence: <strong>{b.confidence.toFixed(0)}%</strong></div>
                      <div>Coordinates: <strong>{centerPos[0].toFixed(5)}° N, {centerPos[1].toFixed(5)}° E</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* HIGHLIGHT DETECTED FEATURES ON MAP */}
        {groundingBoxes && groundingBoxes.length > 0 && effectiveBounds && (() => {
          const [south, north, west, east] = effectiveBounds;

          return groundingBoxes.map((box) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            const latMin = north - (ymax / 1000) * (north - south);
            const latMax = north - (ymin / 1000) * (north - south);
            const lngMin = west + (xmin / 1000) * (east - west);
            const lngMax = west + (xmax / 1000) * (east - west);
            const isFocused = box.id === focusedBoxId;

            return (
              <React.Fragment key={box.id}>
                {/* Highlighted Bounding Box */}
                <Rectangle
                  bounds={[[latMin, lngMin], [latMax, lngMax]]}
                  pathOptions={{
                    color: isFocused ? "#F59E0B" : "#38BDF8",
                    weight: isFocused ? 3.5 : 2.5,
                    fillColor: isFocused ? "#D97706" : "#0284C7",
                    fillOpacity: isFocused ? 0.32 : 0.2,
                    dashArray: isFocused ? "4, 2" : "6, 4",
                  }}
                >
                  <Tooltip permanent direction="top" className="grounding-map-tooltip">
                    <div className={`grounding-tooltip-card ${isFocused ? "focused" : ""}`}>
                      <span className="grounding-dot" />
                      <strong>{box.label}</strong>
                      <span className="grounding-conf-pill">{box.confidence.toFixed(1)}%</span>
                    </div>
                  </Tooltip>
                </Rectangle>

                {/* Center Reticle Marker */}
                <CircleMarker
                  center={[(latMin + latMax) / 2, (lngMin + lngMax) / 2]}
                  radius={isFocused ? 7 : 5}
                  pathOptions={{
                    color: isFocused ? "#F59E0B" : "#38BDF8",
                    fillColor: "#FFFFFF",
                    fillOpacity: 0.95,
                    weight: 2,
                  }}
                />
              </React.Fragment>
            );
          });
        })()}

        {/* AUTHENTIC ADMINISTRATIVE BORDER (REAL BORDERS, NEVER RECTANGULAR BOX) */}
        {boundaryGeoJson?.geometry && !location?.displayName?.includes("All-India") && (
          <GeoJSON
            key={`boundary-${location?.regionName || "region"}-${JSON.stringify(boundaryGeoJson.properties?.name || "geo")}`}
            data={boundaryGeoJson}
            style={{
              color: "#2563EB",
              weight: 2.5,
              opacity: 0.92,
              dashArray: "6, 4",
              fillColor: "#3B82F6",
              fillOpacity: 0.08,
            }}
          >
            <Tooltip direction="top" opacity={0.92} permanent={false}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#1D4ED8", padding: "2px" }}>
                📍 Real Border: {location?.displayName}
              </div>
            </Tooltip>
          </GeoJSON>
        )}

        {/* QUERIED LOCATION PIN WITH LATITUDE & LONGITUDE */}
        {location && !location.displayName.includes("All-India") && (
          <>
            {/* Center Bullseye Dot directly at city center coordinates */}
            <CircleMarker
              center={[location.lat, location.lng]}
              radius={4}
              pathOptions={{
                color: "#FFFFFF",
                fillColor: "#2563EB",
                fillOpacity: 1,
                weight: 2,
              }}
            />

            {/* Precision Radar Pulse Ring */}
            <CircleMarker
              center={[location.lat, location.lng]}
              radius={20}
              pathOptions={{
                color: "#2563EB",
                fillColor: "#3B82F6",
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: "4, 3",
              }}
            />

            {/* Target Location Pin */}
            <Marker position={[location.lat, location.lng]} icon={queryTargetPinIcon}>
              <Tooltip permanent={true} direction="top" offset={[0, -42]} className="target-loc-marker-tooltip">
                <div className="target-loc-tooltip-card">
                  <div className="target-loc-tooltip-title">📍 {location.displayName}</div>
                  <div className="target-loc-tooltip-coords">
                    <span>{location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E</span>
                  </div>
                </div>
              </Tooltip>
              <Popup className="target-loc-marker-popup">
                <div className="target-loc-popup-card">
                  <h4>📍 {location.displayName}</h4>
                  <div className="popup-coords-table">
                    <div className="popup-coord-row">
                      <span>Latitude</span>
                      <strong>{location.lat.toFixed(5)}° N</strong>
                    </div>
                    <div className="popup-coord-row">
                      <span>Longitude</span>
                      <strong>{location.lng.toFixed(5)}° E</strong>
                    </div>
                    {location.elevationMeters !== undefined && (
                      <div className="popup-coord-row">
                        <span>Elevation</span>
                        <strong>{location.elevationMeters} meters</strong>
                      </div>
                    )}
                    {location.areaKm2 && (
                      <div className="popup-coord-row">
                        <span>Area</span>
                        <strong>{location.areaKm2} km²</strong>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Direct Map View Tabs */}
      <div className="map-view-tabs-strip">
        <button
          type="button"
          className={`map-view-tab-pill ${tileProvider === "mappls" ? "active" : ""}`}
          onClick={() => setTileProvider("mappls")}
          title="Mappls Satellite (India high-res base)"
        >
          <MapIcon size={12} />
          <span>Mappls Satellite</span>
        </button>
        <button
          type="button"
          className={`map-view-tab-pill ${tileProvider === "sentinel" ? "active" : ""}`}
          onClick={() => setTileProvider("sentinel")}
          title="Sentinel-2 Multispectral Cloudless"
        >
          <Shield size={12} />
          <span>Sentinel-2</span>
        </button>
        <button
          type="button"
          className={`map-view-tab-pill ${tileProvider === "terrain" ? "active" : ""}`}
          onClick={() => setTileProvider("terrain")}
          title="Mappls Topo Terrain"
        >
          <Mountain size={12} />
          <span>Terrain</span>
        </button>
        <button
          type="button"
          className={`map-view-tab-pill ${showPlaceLabels ? "active" : ""}`}
          onClick={() => setShowPlaceLabels(!showPlaceLabels)}
          title="Toggle Geographic Place Names"
        >
          <Eye size={12} />
          <span>Labels</span>
        </button>
        <button
          type="button"
          className="map-view-tab-pill india-pill"
          onClick={resetToAllIndia}
          title="Fit to All-India Extent"
        >
          <span>🇮🇳 All India</span>
        </button>
      </div>

      {/* Toolbar */}
      <MapToolbar
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onReset={resetToLocation}
        onSnapshot={onSnapshot ? handleSnapshotClick : undefined}
      />

      {/* Highlighted Detected Features Pill */}
      {groundingBoxes && groundingBoxes.length > 0 && (
        <div className="detected-highlights-pill">
          <Crosshair size={13} className="text-cyan animate-pulse" />
          <span>{groundingBoxes.length} Features Highlighted on Map</span>
        </div>
      )}

      {/* Location pill with Coordinates */}
      <div className="selected-pill">
        <span className="live-dot" />
        <span className="selected-pill-name">{location?.displayName || "All-India Geospatial View"}</span>
        {location && !location.displayName.includes("All-India") && (
          <span className="selected-pill-coords-tag">
            {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
          </span>
        )}
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="map-loading">
          <span className="spinner-orbit" />
          <span>Processing satellite telemetry...</span>
        </div>
      )}
    </section>
  );
};
