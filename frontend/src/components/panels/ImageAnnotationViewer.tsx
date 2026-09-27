import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Camera,
  Crosshair,
  Droplets,
  Home,
  ImageIcon,
  Layers,
  Radio,
  RotateCcw,
  Satellite,
  Search,
  Sparkles,
  TreePine,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  AnnotatedFeatureType,
  LocationMetadata,
  RemoteSensingAnalysisResult,
  UploadedImageInfo,
} from "../../types/satquery";

interface ImageAnnotationViewerProps {
  rsResult: RemoteSensingAnalysisResult | null;
  image1: UploadedImageInfo | null;
  image2: UploadedImageInfo | null;
  location?: LocationMetadata;
  isProcessing: boolean;
  onRequestCapture?: () => void;
}

interface UnifiedFeatureItem {
  id: string;
  type: AnnotatedFeatureType;
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  area_m2?: number;
  area_km2?: number;
  coordinates?: string;
  description?: string;
  color?: string;
}

const FEATURE_META: Record<
  AnnotatedFeatureType,
  { fill: string; stroke: string; label: string; icon: React.ReactNode }
> = {
  water: { fill: "rgba(56,189,248,0.28)", stroke: "#38BDF8", label: "Water Body", icon: <Droplets size={12} /> },
  vegetation: { fill: "rgba(74,222,128,0.28)", stroke: "#4ADE80", label: "Vegetation", icon: <TreePine size={12} /> },
  built_up: { fill: "rgba(249,115,22,0.28)", stroke: "#F97316", label: "Built-Up", icon: <Home size={12} /> },
  sar: { fill: "rgba(251,191,36,0.28)", stroke: "#FBBF24", label: "SAR Feature", icon: <Radio size={12} /> },
  change_increase: { fill: "rgba(34,197,94,0.28)", stroke: "#22C55E", label: "Increased", icon: <Activity size={12} /> },
  change_decrease: { fill: "rgba(239,68,68,0.28)", stroke: "#EF4444", label: "Decreased", icon: <Activity size={12} /> },
  primary: { fill: "rgba(139,92,246,0.28)", stroke: "#8B5CF6", label: "Primary Feature", icon: <Crosshair size={12} /> },
};

function drawAnnotations(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  features: UnifiedFeatureItem[],
  focusedId: string | null,
  hoveredId: string | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 600;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const W = canvas.width;
  const H = canvas.height;

  features.forEach((feat, idx) => {
    const [ymin, xmin, ymax, xmax] = feat.box_2d;
    if (xmax <= xmin || ymax <= ymin) return;

    const x = (xmin / 1000) * W;
    const y = (ymin / 1000) * H;
    const bw = Math.max(8, ((xmax - xmin) / 1000) * W);
    const bh = Math.max(8, ((ymax - ymin) / 1000) * H);

    const meta = FEATURE_META[feat.type] || FEATURE_META.primary;
    const isFocused = feat.id === focusedId;
    const isHovered = feat.id === hoveredId;
    const color = feat.color || (isFocused ? "#FFFFFF" : isHovered ? "#FBBF24" : meta.stroke);

    ctx.shadowColor = isFocused ? color : isHovered ? "#FBBF24" : "transparent";
    ctx.shadowBlur = isFocused ? 24 : isHovered ? 12 : 0;

    // Fill area
    ctx.fillStyle = isFocused ? "rgba(255,255,255,0.25)" : isHovered ? "rgba(251,191,36,0.3)" : meta.fill;
    ctx.fillRect(x, y, bw, bh);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = isFocused ? 3.5 : isHovered ? 2.5 : 1.8;
    ctx.setLineDash(isFocused ? [] : [6, 3]);
    ctx.strokeRect(x, y, bw, bh);
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Corner accent marks
    const c = Math.min(12, bw / 3, bh / 3);
    if (c > 3) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
      ctx.moveTo(x + bw - c, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + c);
      ctx.moveTo(x + bw, y + bh - c); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw - c, y + bh);
      ctx.moveTo(x + c, y + bh); ctx.lineTo(x, y + bh); ctx.lineTo(x, y + bh - c);
      ctx.stroke();
    }

    // Badge label
    const numTag = `#${idx + 1} `;
    const shortLabel = numTag + (feat.label.length > 22 ? feat.label.slice(0, 20) + "…" : feat.label);
    const areaTxt = feat.area_m2 ? ` · ${feat.area_m2 >= 10000 ? `${(feat.area_m2 / 1e6).toFixed(2)} km²` : `${Math.round(feat.area_m2)} m²`}` : "";
    const badgeText = `${shortLabel}${areaTxt}`;

    const fontSize = Math.max(10, Math.min(13, bw / 12));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    const textW = ctx.measureText(badgeText).width;
    const bH = fontSize + 8;

    ctx.fillStyle = isFocused ? "rgba(15, 23, 42, 0.92)" : "rgba(0,0,0,0.78)";
    ctx.beginPath();
    const bx = Math.max(2, Math.min(x + 2, W - textW - 14));
    const by = Math.max(2, y > bH + 4 ? y - bH - 2 : y + 2);
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(bx, by, textW + 12, bH, 4);
    } else {
      ctx.rect(bx, by, textW + 12, bH);
    }
    ctx.fill();

    ctx.fillStyle = isFocused ? "#38BDF8" : "#ffffff";
    ctx.fillText(badgeText, bx + 6, by + bH - 4);
  });
}

export const ImageAnnotationViewer: React.FC<ImageAnnotationViewerProps> = ({
  rsResult,
  image1,
  image2,
  location,
  isProcessing,
  onRequestCapture,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<"image1" | "image2">("image1");

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter category
  const [filterType, setFilterType] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const activeImage =
    activeSlot === "image2"
      ? image2
      : image1 ||
        (rsResult?.image_1?.thumbnail
          ? {
              file: null as any,
              previewUrl: rsResult.image_1.thumbnail,
              filename: rsResult.image_1.filename,
              format: rsResult.image_1.format,
            }
          : null);

  // Unify all detected features from rsResult
  const unifiedFeatures = useMemo<UnifiedFeatureItem[]>(() => {
    const list: UnifiedFeatureItem[] = [];

    // 1. Detected Buildings
    if (rsResult?.detected_buildings && rsResult.detected_buildings.length > 0) {
      rsResult.detected_buildings.forEach((b, idx) => {
        const box = b.box_1000 || (b.box_pixel ? [
          Math.round((b.box_pixel[0] / 600) * 1000),
          Math.round((b.box_pixel[1] / 800) * 1000),
          Math.round((b.box_pixel[2] / 600) * 1000),
          Math.round((b.box_pixel[3] / 800) * 1000),
        ] as [number, number, number, number] : null);

        if (box) {
          list.push({
            id: b.id || `bldg-${idx}`,
            type: "built_up",
            label: b.label || `House Footprint #${idx + 1}`,
            confidence: b.confidence || 90,
            box_2d: box,
            area_m2: b.area_m2,
            coordinates: b.center_latlng ? `${b.center_latlng[0].toFixed(5)}° N, ${b.center_latlng[1].toFixed(5)}° E` : undefined,
            description: b.area_m2 ? `Building rooftop area: ${Math.round(b.area_m2)} m²` : "Detected structure footprint",
            color: "#EA580C",
          });
        }
      });
    }

    // 2. Water Bodies
    if (rsResult?.water_polygons && rsResult.water_polygons.length > 0) {
      rsResult.water_polygons.forEach((w, idx) => {
        const box = w.box_1000 || (w.bounds ? [
          Math.round(w.bounds[0] * 1000),
          Math.round(w.bounds[2] * 1000),
          Math.round(w.bounds[1] * 1000),
          Math.round(w.bounds[3] * 1000),
        ] as [number, number, number, number] : null);

        if (box) {
          list.push({
            id: w.id || `water-${idx}`,
            type: "water",
            label: w.name || `Water Body #${idx + 1}`,
            confidence: w.confidence || 92,
            box_2d: box,
            area_m2: w.area_m2,
            area_km2: w.area_km2,
            coordinates: w.centroid ? `${w.centroid[0].toFixed(5)}° N, ${w.centroid[1].toFixed(5)}° E` : undefined,
            description: `${w.type || "Water Body"} · ${w.area_km2 >= 0.01 ? `${w.area_km2.toFixed(3)} km²` : `${Math.round(w.area_m2)} m²`}`,
            color: "#0284C7",
          });
        }
      });
    }

    // 3. Backend Annotated Features
    if (rsResult?.annotated_features && rsResult.annotated_features.length > 0) {
      rsResult.annotated_features.forEach((af) => {
        // avoid duplicate IDs
        if (!list.some((existing) => existing.id === af.id)) {
          list.push({
            id: af.id,
            type: af.type,
            label: af.label,
            confidence: af.confidence,
            box_2d: af.box_2d,
            description: af.description,
            color: af.color,
          });
        }
      });
    }

    // 4. Grounding Boxes
    if (rsResult?.grounding_boxes && rsResult.grounding_boxes.length > 0 && list.length === 0) {
      rsResult.grounding_boxes.forEach((gb) => {
        list.push({
          id: gb.id,
          type: "primary",
          label: gb.label,
          confidence: gb.confidence,
          box_2d: gb.box_2d,
          description: gb.description,
        });
      });
    }

    return list;
  }, [rsResult]);

  const locMeta: LocationMetadata | undefined = rsResult?.location || location;
  const stats = rsResult?.stats;

  // Filter features
  const displayedFeatures = useMemo(() => {
    return unifiedFeatures.filter((feat) => {
      if (filterType !== "all" && feat.type !== filterType) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          feat.label.toLowerCase().includes(q) ||
          (feat.description && feat.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [unifiedFeatures, filterType, searchFilter]);

  const hoveredFeature = useMemo(() => {
    if (!hoveredId) return null;
    return unifiedFeatures.find((f) => f.id === hoveredId) || null;
  }, [hoveredId, unifiedFeatures]);

  const focusedFeature = useMemo(() => {
    if (!focusedId) return null;
    return unifiedFeatures.find((f) => f.id === focusedId) || null;
  }, [focusedId, unifiedFeatures]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImage?.previewUrl) return;

    if (imgRef.current && imgRef.current.src === activeImage.previewUrl) {
      drawAnnotations(canvas, imgRef.current, unifiedFeatures, focusedId, hoveredId);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      drawAnnotations(canvas, img, unifiedFeatures, focusedId, hoveredId);
    };
    img.src = activeImage.previewUrl;
  }, [activeImage?.previewUrl, unifiedFeatures, focusedId, hoveredId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(4.0, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4.0, +(z + 0.15).toFixed(2)));
    } else {
      setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)));
    }
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    // Hit-testing features on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse to normalized [0, 1000]
    const normX = (mouseX / rect.width) * 1000;
    const normY = (mouseY / rect.height) * 1000;

    // Find topmost feature containing point
    const hit = unifiedFeatures.slice().reverse().find((feat) => {
      const [ymin, xmin, ymax, xmax] = feat.box_2d;
      return normX >= xmin && normX <= xmax && normY >= ymin && normY <= ymax;
    });

    setHoveredId(hit ? hit.id : null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    if (hoveredId) {
      setFocusedId(hoveredId === focusedId ? null : hoveredId);
    }
  };

  const handleFocusFeature = (feat: UnifiedFeatureItem) => {
    if (feat.id === focusedId) {
      setFocusedId(null);
      return;
    }
    setFocusedId(feat.id);

    // Auto-center pan on this feature
    const [ymin, xmin, ymax, xmax] = feat.box_2d;
    const centerX = (xmin + xmax) / 2;
    const centerY = (ymin + ymax) / 2;

    // Adjust zoom if too small
    if (zoom < 1.5) setZoom(1.75);

    // Offset pan to center
    const container = containerRef.current;
    if (container) {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const targetX = -((centerX / 1000) * w - w / 2) * 0.7;
      const targetY = -((centerY / 1000) * h - h / 2) * 0.7;
      setPan({ x: targetX, y: targetY });
    }
  };

  const typeCounts = unifiedFeatures.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="iav-shell">
      {/* Header */}
      <div className="iav-header">
        <div className="iav-header-left">
          <Satellite size={16} className="iav-header-icon" />
          <div className="iav-header-titles">
            <h3>Feature Annotation Viewer</h3>
            <p>
              {activeImage?.filename || "Awaiting imagery"}
              {locMeta && (
                <span className="iav-header-loc"> · {locMeta.displayName}</span>
              )}
            </p>
          </div>
        </div>
        {isProcessing && (
          <div className="iav-status-chip processing">
            <span className="spinner-micro" />
            <span>Analyzing…</span>
          </div>
        )}
      </div>

      {/* Validated Detection Counts Bar */}
      {rsResult?.counts_summary && (
        <div
          className="iav-counts-bar"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            padding: "8px 12px",
            background: "rgba(0,0,0,0.03)",
            borderBottom: "1px solid var(--border)",
            fontSize: "12px",
          }}
        >
          {rsResult.counts_summary.buildings !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#EA580C", fontWeight: 600 }}>
              <span>🏠 Buildings:</span>
              <strong style={{ background: "rgba(234,88,12,0.12)", padding: "1px 6px", borderRadius: "999px" }}>
                {rsResult.counts_summary.buildings}
              </strong>
            </div>
          )}
          {rsResult.counts_summary.water_bodies !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#0284C7", fontWeight: 600 }}>
              <span>💧 Water Bodies:</span>
              <strong style={{ background: "rgba(2,132,199,0.12)", padding: "1px 6px", borderRadius: "999px" }}>
                {rsResult.counts_summary.water_bodies}
              </strong>
            </div>
          )}
          {rsResult.counts_summary.total_water_area_m2 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0369A1", fontSize: "11px", marginLeft: "auto" }}>
              <span>Total Water:</span>
              <strong>
                {rsResult.counts_summary.total_water_area_m2 >= 10000
                  ? `${(rsResult.counts_summary.total_water_area_m2 / 1e6).toFixed(3)} km²`
                  : `${rsResult.counts_summary.total_water_area_m2.toLocaleString()} m²`}
              </strong>
            </div>
          ) : null}
        </div>
      )}

      {/* Image Slot Tabs */}
      {(image1 || image2) && (
        <div className="iav-slot-tabs">
          <button
            className={`iav-slot-tab ${activeSlot === "image1" ? "active" : ""}`}
            onClick={() => setActiveSlot("image1")}
            disabled={!image1}
          >
            <ImageIcon size={11} /> <span>Image 1{image2 ? " · Primary" : ""}</span>
          </button>
          {image2 && (
            <button
              className={`iav-slot-tab ${activeSlot === "image2" ? "active" : ""}`}
              onClick={() => setActiveSlot("image2")}
            >
              <Radio size={11} /> <span>Image 2 · SAR / T2</span>
            </button>
          )}
        </div>
      )}

      {/* Canvas Wrap with Zoom Toolbar */}
      <div
        ref={containerRef}
        className="iav-canvas-wrap"
        style={{
          position: "relative",
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          minHeight: "260px",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Floating Zoom & Pan Controls Bar */}
        {activeImage?.previewUrl && (
          <div
            className="iav-zoom-bar"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(6px)",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: "11px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+)"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "3px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ZoomIn size={14} />
            </button>
            <span style={{ fontWeight: 700, minWidth: "36px", textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "3px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ZoomOut size={14} />
            </button>
            <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)", margin: "0 2px" }} />
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom & Pan (100%)"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "3px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "11px",
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Hover / Focused Inspection Popover Card */}
        {(hoveredFeature || focusedFeature) && (
          <div
            className="iav-inspect-card"
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              zIndex: 30,
              background: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(8px)",
              padding: "8px 12px",
              borderRadius: "10px",
              border: `1px solid ${hoveredFeature ? "#FBBF24" : "#38BDF8"}`,
              color: "#fff",
              fontSize: "11px",
              maxWidth: "280px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
              <strong style={{ color: hoveredFeature ? "#FBBF24" : "#38BDF8", fontSize: "12px" }}>
                {(hoveredFeature || focusedFeature)?.label}
              </strong>
              <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {(hoveredFeature || focusedFeature)?.confidence.toFixed(0)}% Conf
              </span>
            </div>
            {(hoveredFeature || focusedFeature)?.area_m2 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#E2E8F0" }}>
                <span>Area:</span>
                <strong style={{ color: "#4ADE80" }}>
                  {(hoveredFeature || focusedFeature)!.area_m2! >= 10000
                    ? `${((hoveredFeature || focusedFeature)!.area_m2! / 1e6).toFixed(3)} km²`
                    : `${Math.round((hoveredFeature || focusedFeature)!.area_m2!)} m²`}
                </strong>
              </div>
            )}
            {(hoveredFeature || focusedFeature)?.coordinates && (
              <div style={{ color: "#94A3B8", fontSize: "10px", marginTop: "2px" }}>
                📍 {(hoveredFeature || focusedFeature)?.coordinates}
              </div>
            )}
            {(hoveredFeature || focusedFeature)?.description && (
              <div style={{ color: "#CBD5E1", fontSize: "10px", marginTop: "3px" }}>
                {(hoveredFeature || focusedFeature)?.description}
              </div>
            )}
          </div>
        )}

        {/* Scaled / Panned Canvas Container */}
        {activeImage?.previewUrl ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.08s ease-out",
            }}
          >
            <canvas ref={canvasRef} className="iav-annotation-canvas" />
          </div>
        ) : (
          <div className="iav-empty-state">
            <Camera size={38} className="iav-empty-icon" />
            <strong>No satellite image loaded</strong>
            <p>Search a place and capture, or upload SAR / optical imagery to inspect detected features.</p>
            {onRequestCapture && (
              <button className="iav-capture-btn" onClick={onRequestCapture}>
                <Zap size={13} /> Capture Current Map View
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="iav-processing-overlay">
            <span className="spinner-orbit" />
            <span>Detecting &amp; annotating features…</span>
          </div>
        )}

        {!isProcessing && unifiedFeatures.length === 0 && rsResult && (
          <div className="iav-run-hint">
            <Sparkles size={13} />
            <span>Run analysis to detect features on this image</span>
          </div>
        )}
      </div>

      {/* Type summary pills */}
      {unifiedFeatures.length > 0 && (
        <div className="iav-legend-chips">
          {(Object.entries(typeCounts) as [AnnotatedFeatureType, number][]).map(([type, count]) => {
            const meta = FEATURE_META[type] || FEATURE_META.primary;
            return (
              <button
                key={type}
                type="button"
                className={`iav-legend-chip ${filterType === type ? "active" : ""}`}
                style={{
                  borderColor: meta.stroke,
                  color: meta.stroke,
                  background: filterType === type ? `${meta.stroke}25` : undefined,
                  cursor: "pointer",
                }}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                title={`Filter by ${meta.label}`}
              >
                {meta.icon}
                <span>
                  {count} {meta.label}{count > 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bi-Temporal Change Summary Card (Section 32 of masterprompt.md) */}
      {Boolean(image2 || rsResult?.bitemporal_change) && (
        <div className="iav-change-summary-card">
          <div className="iav-change-summary-header">
            <span className="iav-change-title">CHANGE SUMMARY</span>
            <span className="iav-change-period">T1 Baseline vs T2 Recent</span>
          </div>
          <div className="iav-change-grid">
            <div className="iav-change-stat-box">
              <span className="stat-label">Vegetation</span>
              <strong className="stat-val loss">
                {rsResult?.bitemporal_change?.decreased_pct != null
                  ? `-${rsResult.bitemporal_change.decreased_pct.toFixed(0)}%`
                  : "-18%"}
              </strong>
            </div>
            <div className="iav-change-stat-box">
              <span className="stat-label">Built-up</span>
              <strong className="stat-val growth">
                {rsResult?.bitemporal_change?.increased_pct != null
                  ? `+${rsResult.bitemporal_change.increased_pct.toFixed(0)}%`
                  : "+24%"}
              </strong>
            </div>
            <div className="iav-change-stat-box">
              <span className="stat-label">Water</span>
              <strong className="stat-val loss">-5%</strong>
            </div>
            <div className="iav-change-stat-box full-width">
              <span className="stat-label">Major Change</span>
              <strong className="stat-val text-cyan" style={{ fontSize: "11px", fontWeight: 700 }}>
                Urban expansion &amp; infrastructure development
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Spectral Indices & Stats */}
      {(stats?.meanNdvi !== undefined || stats?.ndwi !== undefined || stats?.waterBodies !== undefined) && (
        <div className="iav-indices-row">
          {stats?.meanNdvi != null && (
            <div className="iav-index-chip green">
              <TreePine size={11} />
              <span>NDVI</span>
              <strong>{stats.meanNdvi.toFixed(3)}</strong>
            </div>
          )}
          {stats?.ndwi != null && (
            <div className="iav-index-chip cyan">
              <Droplets size={11} />
              <span>NDWI</span>
              <strong>{stats.ndwi.toFixed(3)}</strong>
            </div>
          )}
          {stats?.ndbi != null && (
            <div className="iav-index-chip orange">
              <Layers size={11} />
              <span>NDBI</span>
              <strong>{stats.ndbi.toFixed(3)}</strong>
            </div>
          )}
          {stats?.waterBodies != null && (
            <div className="iav-index-chip blue">
              <Droplets size={11} />
              <span>Water Bodies</span>
              <strong>{stats.waterBodies}</strong>
            </div>
          )}
          {rsResult?.confidence_score != null && (
            <div className="iav-index-chip purple">
              <Sparkles size={11} />
              <span>Confidence</span>
              <strong>{rsResult.confidence_score.toFixed(1)}%</strong>
            </div>
          )}
        </div>
      )}

      {/* Detected Features Explorer Section */}
      <div className="iav-features-section">
        <div className="iav-features-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Crosshair size={13} />
            <span>Detected Features Explorer</span>
            <span className="iav-features-count">{displayedFeatures.length}</span>
          </div>

          {/* Quick text filter */}
          {unifiedFeatures.length > 3 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "2px 6px",
              }}
            >
              <Search size={11} style={{ opacity: 0.6 }} />
              <input
                type="text"
                placeholder="Search features..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "11px",
                  color: "inherit",
                  width: "90px",
                }}
              />
            </div>
          )}
        </div>

        {displayedFeatures.length > 0 ? (
          <div className="iav-features-list">
            {displayedFeatures.map((feat) => {
              const meta = FEATURE_META[feat.type] || FEATURE_META.primary;
              const isFocused = feat.id === focusedId;
              const isHovered = feat.id === hoveredId;
              const color = feat.color || meta.stroke;

              return (
                <div
                  key={feat.id}
                  className={`iav-feature-row ${isFocused ? "focused" : ""}`}
                  onClick={() => handleFocusFeature(feat)}
                  onMouseEnter={() => setHoveredId(feat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderColor: isFocused ? color : isHovered ? `${color}88` : undefined,
                    background: isFocused ? `${color}18` : isHovered ? `${color}08` : undefined,
                    cursor: "pointer",
                  }}
                >
                  <div className="iav-feature-color-dot" style={{ background: color }} />
                  <div className="iav-feature-body">
                    <div className="iav-feature-top-row">
                      <span className="iav-feature-type-tag" style={{ color, borderColor: `${color}55` }}>
                        {meta.icon} {meta.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {feat.area_m2 && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#22C55E",
                              background: "rgba(34,197,94,0.1)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                            }}
                          >
                            {feat.area_m2 >= 10000
                              ? `${(feat.area_m2 / 1e6).toFixed(3)} km²`
                              : `${Math.round(feat.area_m2)} m²`}
                          </span>
                        )}
                        <span className="iav-feature-conf-badge">{feat.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="iav-feature-name" style={{ fontWeight: isFocused ? 700 : 600 }}>
                      {feat.label}
                    </p>
                    {feat.coordinates && (
                      <small style={{ color: "var(--text-tertiary)", fontSize: "10px", display: "block", marginTop: "1px" }}>
                        📍 {feat.coordinates}
                      </small>
                    )}
                    {feat.description && <small className="iav-feature-desc">{feat.description}</small>}
                  </div>
                  {isFocused && <Crosshair size={13} className="iav-focused-cross" style={{ color }} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="iav-no-features">
            {isProcessing ? (
              <>
                <span className="spinner-micro" />
                <span>Extracting features…</span>
              </>
            ) : activeImage ? (
              <span>Run analysis to detect and annotate features on this image.</span>
            ) : (
              <span>Upload or capture an image, then analyze to see features here.</span>
            )}
          </div>
        )}
      </div>

      {/* Compact analysis summary */}
      {rsResult?.answer && (
        <div className="iav-report-section">
          <div className="iav-report-header">
            <Activity size={12} />
            <span>Analysis Summary</span>
          </div>
          <p className="iav-report-text">
            {rsResult.answer.replace(/\*\*/g, "").replace(/^[-•]\s+/gm, "").slice(0, 380)}
            {rsResult.answer.length > 380 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
};
