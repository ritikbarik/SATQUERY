import { Crosshair, Layers, LocateFixed, MapPin, Maximize2, Minus, PenTool, Plus, Ruler } from "lucide-react";

interface MapToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const tools = [
  { label: "Layers", icon: Layers },
  { label: "Location", icon: MapPin },
  { label: "Measure", icon: Ruler },
  { label: "Draw selection", icon: PenTool },
];

export const MapToolbar = ({ onZoomIn, onZoomOut, onReset }: MapToolbarProps) => (
  <div className="map-toolbar" aria-label="Map tools">
    {tools.map((tool) => {
      const Icon = tool.icon;
      return (
        <button key={tool.label} aria-label={tool.label} title={tool.label}>
          <Icon size={20} />
        </button>
      );
    })}
    <span className="tool-separator" />
    <button aria-label="Zoom in" title="Zoom in" onClick={onZoomIn}><Plus size={21} /></button>
    <button aria-label="Zoom out" title="Zoom out" onClick={onZoomOut}><Minus size={21} /></button>
    <button aria-label="Locate selected area" title="Locate selected area" onClick={onReset}><Crosshair size={20} /></button>
    <button aria-label="Reset view" title="Reset view" onClick={onReset}><LocateFixed size={20} /></button>
    <button aria-label="Fullscreen map" title="Fullscreen map"><Maximize2 size={20} /></button>
  </div>
);
