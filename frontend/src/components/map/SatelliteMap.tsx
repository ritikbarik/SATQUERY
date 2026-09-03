import { useEffect, useRef, useState } from "react";
import { Compass, Layers, Map as MapIcon, Mountain } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
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
    name: "Carto Analytics",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
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

export const SatelliteMap = ({
  location,
  activeLayerSet,
  features,
  isProcessing,
}: SatelliteMapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const [tileProvider, setTileProvider] = useState<TileProvider>("esri");
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
      {/* Tile Layer Provider Switcher */}
      <div className="view-switcher">
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
                  {key === "sentinel" && <Layers size={13} />}
                  {key === "dark" && <MapIcon size={13} />}
                  {key === "topo" && <Mountain size={13} />}
                  <span>{TILE_PROVIDERS[key].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compass Bearing */}
      <div className="compass" title="Compass Bearing (North Up)">
        <Compass size={52} />
      </div>

      {/* Main 2D Satellite Map */}
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

      {/* Map Navigation Toolbar */}
      <MapToolbar
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onReset={resetToLocation}
      />

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
      <button className="india-extent-btn" onClick={resetToAllIndia} title="Fit to All-India Extent">
        🇮🇳 All-India Extent
      </button>

      <MapLegend />
    </section>
  );
};
