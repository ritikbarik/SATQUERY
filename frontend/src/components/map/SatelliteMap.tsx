import { useEffect, useRef, useState } from "react";
import { Box, Compass, Layers, Map as MapIcon, Mountain, SplitSquareHorizontal } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Badge } from "../common/Badge";
import { MapLayers } from "./MapLayers";
import { MapLegend } from "./MapLegend";
import { MapToolbar } from "./MapToolbar";
import type { GeoFeature, LocationMetadata } from "../../types/satquery";

interface SatelliteMapProps {
  location?: LocationMetadata;
  activeLayerSet: Set<string>;
  features: GeoFeature[];
  isProcessing: boolean;
  onLayerToggle?: (layer: "vegetation" | "water" | "built" | "decrease" | "increase") => void;
}

type TileProvider = "esri" | "sentinel" | "dark" | "topo";

const TILE_PROVIDERS: Record<TileProvider, { name: string; url: string; attribution: string }> = {
  esri: {
    name: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Earthstar Geographics",
  },
  sentinel: {
    name: "Sentinel-2 Cloudless",
    url: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
    attribution: "Sentinel-2 cloudless by EOX IT Services GmbH",
  },
  dark: {
    name: "Dark Analytics",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  topo: {
    name: "Open Topography",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
  },
};

// Map controller to smoothly fly to new coordinates
const MapViewController = ({ location }: { location?: LocationMetadata }) => {
  const map = useMap();

  useEffect(() => {
    if (location && location.lat && location.lng) {
      const zoom =
        location.areaKm2 > 100000
          ? 6
          : location.areaKm2 > 10000
          ? 7
          : location.areaKm2 > 2000
          ? 9
          : location.areaKm2 < 10
          ? 13
          : 11;
      map.flyTo([location.lat, location.lng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [location?.lat, location?.lng, location?.areaKm2, map]);

  return null;
};

// 3D Earth using Google Earth iframe
const Earth3DView = ({ location }: { location?: LocationMetadata }) => {
  const lat = location?.lat ?? 20.5937;
  const lng = location?.lng ?? 78.9629;
  const zoom = location?.areaKm2 && location.areaKm2 > 50000 ? 6 : 9;

  // Google Earth web embed URL
  const googleEarthUrl = `https://earth.google.com/web/@${lat},${lng},500a,${zoom * 150000}d,35y,0h,0t,0r`;

  return (
    <div className="earth-3d-container">
      <iframe
        src={googleEarthUrl}
        title="Google Earth 3D View"
        className="earth-3d-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
      <div className="earth-3d-overlay">
        <span className="earth-badge">🌍 Google Earth 3D</span>
        <span className="earth-coords">
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
        </span>
      </div>
    </div>
  );
};

// Split view – 2D left, 3D right
const SplitView = ({
  location,
  tileProvider,
  activeLayerSet,
  features,
}: {
  location?: LocationMetadata;
  tileProvider: TileProvider;
  activeLayerSet: Set<string>;
  features: GeoFeature[];
}) => {
  const centerLat = location?.lat ?? 20.5937;
  const centerLng = location?.lng ?? 78.9629;
  const initialZoom = location ? (location.areaKm2 > 50000 ? 7 : 9) : 5;

  return (
    <div className="split-view-container">
      <div className="split-pane split-2d">
        <div className="split-label">2D Satellite</div>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={initialZoom}
          minZoom={4}
          maxZoom={18}
          zoomControl={false}
          className="satellite-map"
        >
          <TileLayer
            key={tileProvider}
            attribution={TILE_PROVIDERS[tileProvider].attribution}
            url={TILE_PROVIDERS[tileProvider].url}
            maxZoom={18}
          />
          <MapViewController location={location} />
          <MapLayers activeLayerSet={activeLayerSet} features={features} />
        </MapContainer>
      </div>
      <div className="split-divider" />
      <div className="split-pane split-3d">
        <div className="split-label">3D Earth</div>
        <Earth3DView location={location} />
      </div>
    </div>
  );
};

export const SatelliteMap = ({
  location,
  activeLayerSet,
  features,
  isProcessing,
}: SatelliteMapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const [tileProvider, setTileProvider] = useState<TileProvider>("esri");
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const centerLat = location?.lat ?? 20.5937;
  const centerLng = location?.lng ?? 78.9629;
  const initialZoom = location ? (location.areaKm2 > 50000 ? 7 : 9) : 5;

  const resetToAllIndia = () => {
    mapRef.current?.flyTo([22.5, 82.0], 5, { duration: 1.0 });
  };

  const resetToLocation = () => {
    if (location) {
      mapRef.current?.flyTo([location.lat, location.lng], 9, { duration: 0.8 });
    }
  };

  return (
    <section className="map-shell">
      {/* View Mode Switcher */}
      <div className="view-switcher" role="tablist" aria-label="Map view">
        <Badge active={viewMode === "2d"} onClick={() => setViewMode("2d")} className="cursor-pointer">
          <MapIcon size={14} /> 2D Map
        </Badge>
        <Badge active={viewMode === "3d"} onClick={() => setViewMode("3d")} className="cursor-pointer">
          <Box size={14} /> 3D Earth
        </Badge>
        <Badge active={viewMode === "split"} onClick={() => setViewMode("split")} className="cursor-pointer">
          <SplitSquareHorizontal size={14} /> Split View
        </Badge>

        {/* Layer switcher only for 2D */}
        {viewMode !== "3d" && (
          <div className="tile-layer-dropdown-wrapper">
            <button
              className="layer-switch-btn"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Switch Satellite Imagery Provider"
            >
              <Layers size={14} />
              <span>{TILE_PROVIDERS[tileProvider].name}</span>
            </button>

            {showLayerMenu && (
              <div className="tile-layer-menu">
                {(Object.keys(TILE_PROVIDERS) as TileProvider[]).map((key) => (
                  <button
                    key={key}
                    className={`tile-layer-option ${tileProvider === key ? "active" : ""}`}
                    onClick={() => {
                      setTileProvider(key);
                      setShowLayerMenu(false);
                    }}
                  >
                    {key === "esri" && <MapIcon size={13} />}
                    {key === "sentinel" && <Box size={13} />}
                    {key === "dark" && <Layers size={13} />}
                    {key === "topo" && <Mountain size={13} />}
                    <span>{TILE_PROVIDERS[key].name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compass – only for 2D */}
      {viewMode === "2d" && (
        <div className="compass" title="Compass Bearing (North Up)">
          <Compass size={56} />
        </div>
      )}

      {/* Main content area */}
      {viewMode === "2d" && (
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={initialZoom}
          minZoom={4}
          maxZoom={18}
          zoomControl={false}
          className="satellite-map"
          ref={mapRef}
        >
          <TileLayer
            key={tileProvider}
            attribution={TILE_PROVIDERS[tileProvider].attribution}
            url={TILE_PROVIDERS[tileProvider].url}
            maxZoom={18}
          />
          <MapViewController location={location} />
          <MapLayers activeLayerSet={activeLayerSet} features={features} />
        </MapContainer>
      )}

      {viewMode === "3d" && <Earth3DView location={location} />}

      {viewMode === "split" && (
        <SplitView
          location={location}
          tileProvider={tileProvider}
          activeLayerSet={activeLayerSet}
          features={features}
        />
      )}

      {/* Toolbar (only 2D) */}
      {viewMode === "2d" && (
        <MapToolbar
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onReset={resetToLocation}
        />
      )}

      {/* Location pill */}
      <div className="selected-pill">
        <span className="live-dot" />
        {location?.displayName || "All-India Geospatial View"}
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="map-loading">
          <span className="spinner-orbit" />
          <span>Processing multispectral satellite telemetry...</span>
        </div>
      )}

      {/* All-India extent button */}
      {viewMode === "2d" && (
        <button className="india-extent-btn" onClick={resetToAllIndia} title="Fit to All-India Extent">
          🇮🇳 All-India Extent
        </button>
      )}

      {viewMode === "2d" && <MapLegend />}
    </section>
  );
};
