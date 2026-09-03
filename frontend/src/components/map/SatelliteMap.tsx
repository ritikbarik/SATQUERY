import { useEffect, useRef, useState } from "react";
import { Compass, Eye, Layers, Map as MapIcon, Mountain, Shield } from "lucide-react";
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

type TileProvider = "arcgis" | "arcgis_clarity" | "arcgis_topo" | "sentinel";

const TILE_PROVIDERS: Record<TileProvider, { name: string; url: string; attribution: string; maxZoom: number }> = {
  arcgis: {
    name: "ArcGIS World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community",
    maxZoom: 19,
  },
  arcgis_clarity: {
    name: "ArcGIS Imagery Clarity",
    url: "https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; ArcGIS Clarity Archive",
    maxZoom: 19,
  },
  arcgis_topo: {
    name: "ArcGIS World Topo",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; World Topographic Map",
    maxZoom: 19,
  },
  sentinel: {
    name: "Sentinel-2 Cloudless",
    url: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
    attribution: "Sentinel-2 cloudless by EOX IT Services GmbH",
    maxZoom: 18,
  },
};

// ArcGIS World Reference Overlay (Boundaries and Places)
const ARCGIS_REFERENCE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

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
  const [tileProvider, setTileProvider] = useState<TileProvider>("arcgis");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showPlaceLabels, setShowPlaceLabels] = useState(true);

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

  const currentProvider = TILE_PROVIDERS[tileProvider];

  return (
    <section className="map-shell">
      {/* ArcGIS Tile Layer & Label Controls */}
      <div className="view-switcher">
        <div className="tile-layer-dropdown-wrapper">
          <button
            className="layer-switch-btn"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="ArcGIS World Imagery and Map Style"
          >
            <Layers size={14} />
            <span>{currentProvider.name}</span>
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
                  {key === "arcgis" && <MapIcon size={13} />}
                  {key === "arcgis_clarity" && <Eye size={13} />}
                  {key === "arcgis_topo" && <Mountain size={13} />}
                  {key === "sentinel" && <Shield size={13} />}
                  <span>{TILE_PROVIDERS[key].name}</span>
                </button>
              ))}

              <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0", paddingTop: "4px" }}>
                <button
                  className={`tile-layer-option ${showPlaceLabels ? "active" : ""}`}
                  onClick={() => setShowPlaceLabels(!showPlaceLabels)}
                >
                  <Eye size={13} />
                  <span>{showPlaceLabels ? "Hide Place Labels" : "Show Place Labels"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compass Bearing */}
      <div className="compass" title="Compass Bearing (North Up)">
        <Compass size={52} />
      </div>

      {/* ArcGIS World Imagery Map */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={initialZoom}
        minZoom={4}
        maxZoom={19}
        zoomControl={false}
        className="satellite-map"
        ref={mapRef}
      >
        {/* Primary ArcGIS Base Tile Layer */}
        <TileLayer
          key={tileProvider}
          attribution={currentProvider.attribution}
          url={currentProvider.url}
          maxZoom={currentProvider.maxZoom}
        />

        {/* Optional ArcGIS Boundaries & Places Reference Labels Overlay */}
        {showPlaceLabels && tileProvider.startsWith("arcgis") && (
          <TileLayer
            key="arcgis-places-labels"
            url={ARCGIS_REFERENCE_URL}
            maxZoom={19}
            opacity={0.85}
          />
        )}

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
          <span>Processing multispectral telemetry on ArcGIS imagery...</span>
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
