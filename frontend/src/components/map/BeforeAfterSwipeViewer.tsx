import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Camera,
} from "lucide-react";
import type { LocationMetadata, UploadedImageInfo } from "../../types/satquery";

interface BeforeAfterSwipeViewerProps {
  image1?: UploadedImageInfo | null; // Baseline (T1)
  image2?: UploadedImageInfo | null; // Comparison (T2)
  location?: LocationMetadata;
  onCaptureSlot?: (slot: "image1" | "image2") => void;
  isCapturing?: boolean;
}

export const BeforeAfterSwipeViewer: React.FC<BeforeAfterSwipeViewerProps> = ({
  image1,
  image2,
  location,
  onCaptureSlot,
  isCapturing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const animDirectionRef = useRef<number>(1);

  // Fallback high-resolution satellite imagery URLs if custom rasters aren't yet uploaded
  const fallbackCurrentUrl =
    location?.lat && location?.lng
      ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/${Math.floor(
          ((1 -
            Math.log(
              Math.tan((location.lat * Math.PI) / 180) +
                1 / Math.cos((location.lat * Math.PI) / 180)
            ) /
              Math.PI) /
            2) *
            Math.pow(2, 16)
        )}/${Math.floor(((location.lng + 180) / 360) * Math.pow(2, 16))}`
      : "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80";

  const img1Src = image1?.previewUrl || fallbackCurrentUrl;
  const img2Src = image2?.previewUrl || fallbackCurrentUrl;

  // Handle Dragging of the Split Slider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const updateSliderFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderFromClientX(e.clientX);
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        updateSliderFromClientX(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };

    if (isDragging || isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, isPanning, updateSliderFromClientX]);

  // Automated Swipe Animation / Play feature
  useEffect(() => {
    if (!isPlayingAnimation) return;
    const interval = setInterval(() => {
      setSliderPos((prev) => {
        let next = prev + animDirectionRef.current * 0.8;
        if (next >= 92) {
          animDirectionRef.current = -1;
          next = 92;
        } else if (next <= 8) {
          animDirectionRef.current = 1;
          next = 8;
        }
        return next;
      });
    }, 24);

    return () => clearInterval(interval);
  }, [isPlayingAnimation]);

  const handleStartPan = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".swipe-slider-divider")) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  };

  return (
    <div className="before-after-swipe-container" ref={containerRef}>
      {/* Top Floating Badge Strip */}
      <div className="swipe-header-strip">
        <div className="swipe-badge swipe-badge-historical">
          <Calendar size={13} />
          <span className="badge-year">T1</span>
          <span className="badge-label">Baseline Image</span>
          {image1 && <span className="badge-file">{image1.filename}</span>}
        </div>

        <div className="swipe-badge-center-indicator">
          <span>{sliderPos.toFixed(0)}% Split</span>
        </div>

        <div className="swipe-badge swipe-badge-current">
          <Sparkles size={13} />
          <span className="badge-year">T2</span>
          <span className="badge-label">Comparison Image</span>
          {image2 && <span className="badge-file">{image2.filename}</span>}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className="swipe-viewport"
        onMouseDown={handleStartPan}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Layer 2: CURRENT / AFTER (Base layer full width) */}
        <div
          className="swipe-layer swipe-layer-current"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={img2Src}
            alt="Comparison Satellite View"
            className="swipe-image"
            draggable={false}
          />
          <div className="swipe-watermark watermark-current">
            <span>T2 Comparison View</span>
          </div>
        </div>

        {/* Layer 1: HISTORICAL / BEFORE (Clipped layer on left) */}
        <div
          className="swipe-layer swipe-layer-historical"
          style={{
            clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={img1Src}
            alt="Baseline Satellite View"
            className="swipe-image historical-filter"
            draggable={false}
          />
          <div className="swipe-watermark watermark-historical">
            <span>T1 Baseline View</span>
          </div>
        </div>

        {/* The Swipe Slider Divider & Handle */}
        <div
          className="swipe-slider-divider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="swipe-slider-line" />
          <div className="swipe-slider-handle" title="Drag to compare Before & After">
            <ChevronLeft size={14} className="swipe-handle-arrow" />
            <div className="swipe-handle-grip">
              <span />
              <span />
            </div>
            <ChevronRight size={14} className="swipe-handle-arrow" />
          </div>
        </div>
      </div>

      {/* Floating Toolbar Controls */}
      <div className="swipe-floating-toolbar">
        {/* Play/Pause Auto-Swipe */}
        <button
          type="button"
          className={`swipe-tool-btn ${isPlayingAnimation ? "active" : ""}`}
          onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
          title={isPlayingAnimation ? "Pause Auto-Swipe" : "Play Auto-Swipe Animation"}
        >
          {isPlayingAnimation ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlayingAnimation ? "Pause" : "Auto-Swipe"}</span>
        </button>

        <div className="toolbar-separator" />

        {/* Quick Position Presets */}
        <button
          type="button"
          className={`swipe-preset-btn ${Math.round(sliderPos) === 25 ? "active" : ""}`}
          onClick={() => setSliderPos(25)}
        >
          25%
        </button>
        <button
          type="button"
          className={`swipe-preset-btn ${Math.round(sliderPos) === 50 ? "active" : ""}`}
          onClick={() => setSliderPos(50)}
        >
          50%
        </button>
        <button
          type="button"
          className={`swipe-preset-btn ${Math.round(sliderPos) === 75 ? "active" : ""}`}
          onClick={() => setSliderPos(75)}
        >
          75%
        </button>

        <div className="toolbar-separator" />

        {/* Zoom Controls */}
        <button
          type="button"
          className="swipe-tool-btn"
          onClick={() => setZoom((z) => Math.min(4, z + 0.3))}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <span className="swipe-zoom-label">{(zoom * 100).toFixed(0)}%</span>
        <button
          type="button"
          className="swipe-tool-btn"
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.3))}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          className="swipe-tool-btn"
          onClick={handleResetView}
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>

        {/* Capture Buttons for slots if needed */}
        {onCaptureSlot && (
          <>
            <div className="toolbar-separator" />
            <button
              type="button"
              className="swipe-tool-btn capture-btn"
              disabled={isCapturing}
              onClick={() => onCaptureSlot("image1")}
              title="Capture Current Map as Historical (T1) Baseline"
            >
              <Camera size={13} />
              <span>Capture T1</span>
            </button>
            <button
              type="button"
              className="swipe-tool-btn capture-btn"
              disabled={isCapturing}
              onClick={() => onCaptureSlot("image2")}
              title="Capture Current Map as Current (T2) Image"
            >
              <Camera size={13} />
              <span>Capture T2</span>
            </button>
          </>
        )}
      </div>

      {/* Location / Status Footnote */}
      <div className="swipe-footnote">
        <span className="live-dot" />
        <span>
          Bi-Temporal Swipe Analysis • {location?.displayName || "All-India Extent"} • T1 Baseline vs T2 Recent
        </span>
      </div>
    </div>
  );
};
