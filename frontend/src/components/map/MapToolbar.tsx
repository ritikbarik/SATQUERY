import { Camera, Crosshair, LocateFixed, Maximize2, Minus, Plus } from "lucide-react";

interface MapToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSnapshot?: () => void;
}

export const MapToolbar = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onSnapshot,
}: MapToolbarProps) => (
  <div className="map-toolbar" aria-label="Map tools">
    {onSnapshot && (
      <button
        aria-label="Capture Map Snapshot"
        title="📸 Capture Map Snapshot & Discuss with Vision AI"
        onClick={onSnapshot}
        className="snapshot-toolbar-btn"
      >
        <Camera size={20} />
      </button>
    )}
    <button aria-label="Zoom in" title="Zoom in" onClick={onZoomIn}><Plus size={21} /></button>
    <button aria-label="Zoom out" title="Zoom out" onClick={onZoomOut}><Minus size={21} /></button>
    <button aria-label="Locate selected area" title="Locate selected area" onClick={onReset}><Crosshair size={20} /></button>
    <button aria-label="Reset view" title="Reset view" onClick={onReset}><LocateFixed size={20} /></button>
    <button
      aria-label="Fullscreen map"
      title="Fullscreen map"
      onClick={() => {
        const el = document.getElementById("satquery-map-element") || document.querySelector(".center-viewport-wrapper");
        if (el && !document.fullscreenElement) {
          el.requestFullscreen().catch(() => {});
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }}
    >
      <Maximize2 size={20} />
    </button>
  </div>
);
