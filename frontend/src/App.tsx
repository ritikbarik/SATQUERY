import { useCallback, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { Map as LeafletMap } from "leaflet";
import { Layers, Map as MapIcon, Sparkles } from "lucide-react";
import { AgenticResponseWorkspace } from "./components/ai/AgenticResponseWorkspace";
import { BottomNav } from "./components/layout/BottomNav";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { SatelliteMap } from "./components/map/SatelliteMap";
import { BeforeAfterSwipeViewer } from "./components/map/BeforeAfterSwipeViewer";
import { ChangeMapView } from "./components/map/ChangeMapView";
import { ImageAnnotationViewer } from "./components/panels/ImageAnnotationViewer";
import { InputAnalysisPanel } from "./components/panels/InputAnalysisPanel";
import { RecentQueries } from "./components/panels/RecentQueries";
import { SavedResults } from "./components/panels/SavedResults";
import { SettingsPanel } from "./components/panels/SettingsPanel";
import { useSatQuery } from "./hooks/useSatQuery";
import {
  captureBoundsSatelliteImage,
  captureMapSnapshot,
  capturePlaceSatelliteImage,
  dataUrlToFile,
} from "./services/mapSnapshot";
import { optimizeImage } from "./utils/imageOptimizer";
import { submitRemoteSensingAnalysis } from "./services/satQueryApi";
import type {
  AnalysisMode,
  LocationMetadata,
  RemoteSensingAnalysisResult,
  UploadedImageInfo,
} from "./types/satquery";

export type SidebarTab = "ask" | "recent" | "saved" | "settings";

const App = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("ask");

  // Dedicated Remote-Sensing State
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("single_image");
  const [image1, setImage1] = useState<UploadedImageInfo | null>(null);
  const [image2, setImage2] = useState<UploadedImageInfo | null>(null);
  const [question, setQuestion] = useState("");
  const [isAnalyzingRS, setIsAnalyzingRS] = useState(false);
  const [isCapturingMap, setIsCapturingMap] = useState(false);
  const leafletMapRef = useRef<LeafletMap | null>(null);

  // Center Viewport Mode: "map" | "before_after" | "change_map" (Section 30 of masterprompt.md)
  const [centerViewMode, setCenterViewMode] = useState<"map" | "before_after" | "change_map">("map");
  const [rsResult, setRsResult] = useState<RemoteSensingAnalysisResult | null>(null);
  const [focusedBoxId, setFocusedBoxId] = useState<string | null>(null);

  const satQuery = useSatQuery();

  // Core capture routine that extracts current map raster, optimizes it, and returns UploadedImageInfo
  const captureMapSnapshotItem = useCallback(async (): Promise<UploadedImageInfo | null> => {
    try {
      const targetLoc = satQuery.location;
      const placeName = targetLoc?.displayName || "Satellite View";
      const map = leafletMapRef.current;

      let liveBounds: [number, number, number, number] | undefined;
      let centerLat = targetLoc?.lat ?? 20.5937;
      let centerLng = targetLoc?.lng ?? 78.9629;
      let currentZoom = 15;

      if (map) {
        try {
          const b = map.getBounds();
          liveBounds = [b.getSouth(), b.getNorth(), b.getWest(), b.getEast()];
          const center = map.getCenter();
          centerLat = center.lat;
          centerLng = center.lng;
          currentZoom = map.getZoom();
        } catch (e) {
          console.warn("Could not get current Leaflet bounds:", e);
        }
      }

      const effectiveBounds = liveBounds || (targetLoc?.boundingBox as [number, number, number, number] | undefined);
      let dataUrl: string | null = null;
      let captureSource = "Live Satellite View";

      // 1. Direct client-side DOM html2canvas capture of the zoomed-in map element
      try {
        const mapEl = document.querySelector(".satellite-map") as HTMLElement;
        if (mapEl) {
          const canvas = await html2canvas(mapEl, {
            useCORS: true,
            allowTaint: false,
            logging: false,
            scale: 1.25,
            ignoreElements: (el) =>
              el.classList.contains("map-toolbar") ||
              el.classList.contains("compass") ||
              el.classList.contains("leaflet-control-container") ||
              el.classList.contains("center-mode-switch-bar") ||
              el.classList.contains("top-map-extent-strip"),
          });
          const domDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          if (domDataUrl && domDataUrl.length > 3000) {
            dataUrl = domDataUrl;
            captureSource = `Live Map View (Zoom Level ${currentZoom})`;
          }
        }
      } catch (domErr) {
        console.warn("Direct DOM capture issue, falling back to satellite proxy:", domErr);
      }

      // 2. High-resolution satellite service for the exact bounding box if DOM capture was empty
      if (!dataUrl && effectiveBounds) {
        const snap = await captureBoundsSatelliteImage(
          effectiveBounds,
          placeName,
          centerLat,
          centerLng,
          currentZoom
        );
        if (snap?.dataUrl) {
          dataUrl = snap.dataUrl;
          captureSource = snap.source || `ArcGIS Satellite (Zoom ${currentZoom})`;
        }
      }

      // 3. Fallback snapshot
      if (!dataUrl) {
        dataUrl = await captureMapSnapshot(
          "satquery-map-element",
          targetLoc ? { displayName: targetLoc.displayName, lat: centerLat, lng: centerLng } : undefined
        );
      }

      const cleanSlug = (targetLoc?.regionName || placeName || "Satellite_View").replace(/[^a-zA-Z0-9_-]/g, "_");
      const cleanName = `${cleanSlug}_Zoom${currentZoom}_Capture.jpg`;
      let file = dataUrlToFile(dataUrl, cleanName);
      let previewUrl = dataUrl;

      try {
        const opt = await optimizeImage(file, cleanName);
        file = opt.file;
        previewUrl = opt.previewUrl;
      } catch (optErr) {
        console.warn("Client image optimization fallback:", optErr);
      }

      return {
        file,
        previewUrl,
        filename: cleanName,
        format: "JPEG",
        source: `${captureSource} — ${placeName}`,
        bounds: effectiveBounds,
      };
    } catch (err) {
      console.error("Failed to capture map view:", err);
      return null;
    }
  }, [satQuery.location]);

  // Execute Real Remote-Sensing Analysis
  const handleRunAnalysis = useCallback(
    async (
      customQuery?: string,
      overrideImage1?: UploadedImageInfo | null,
      overrideImage2?: UploadedImageInfo | null
    ) => {
      let activeImage1 = overrideImage1 !== undefined ? overrideImage1 : image1;
      const activeImage2 = overrideImage2 !== undefined ? overrideImage2 : image2;

      // Auto-capture current map view if no image is uploaded/selected
      if (!activeImage1 && analysisMode !== "optical_sar") {
        setIsCapturingMap(true);
        activeImage1 = await captureMapSnapshotItem();
        if (activeImage1) {
          setImage1(activeImage1);
        }
        setIsCapturingMap(false);
      }

      const queryText = (
        customQuery ||
        question ||
        satQuery.input ||
        "Analyze remote-sensing land cover, building structures, and water bodies in this selected satellite image."
      ).trim();
      setIsAnalyzingRS(true);

      try {
        const inPlaceMatch = queryText.match(/\b(?:in|at|near|for|around)\s+([A-Za-z\s]+?)(?:\?|$|\.|\,)/i);
        const targetLocName =
          (inPlaceMatch && inPlaceMatch[1]?.trim()) ||
          activeImage1?.source ||
          satQuery.location?.displayName ||
          "India";

        // Concurrently dispatch query to agent controller for comprehensive synthesis
        satQuery.runQuery(queryText, targetLocName).catch(() => {});

        const result = await submitRemoteSensingAnalysis({
          question: queryText,
          analysis_mode: analysisMode,
          location: targetLocName,
          image_1: activeImage1?.file || null,
          image_2: activeImage2?.file || null,
        });

        // Update local state with real model output & active images
        setRsResult({
          ...result,
          image_1: activeImage1,
          image_2: activeImage2,
        });

        // Synchronize satQuery state cleanly
        if (result.location) {
          satQuery.setLocation(result.location);
        }
        if (result.answer) {
          satQuery.setAnswer(result.answer);
        }
        if (result.stats) {
          const statsObj = result.stats;
          satQuery.setAnalysis((prev) => ({
            ...prev,
            ...statsObj,
            metrics: statsObj.metrics || prev.metrics || [],
            activeLayers: (statsObj.activeLayers as any) || prev.activeLayers,
          }));
        }
        if (result.detailed_report) {
          satQuery.setDetailedReport(result.detailed_report);
        }

        // Auto-highlight first found feature on map if available
        if (result.grounding_boxes && result.grounding_boxes.length > 0) {
          setFocusedBoxId(result.grounding_boxes[0].id);
        }
      } catch (err) {
        console.error("Remote Sensing Analysis error:", err);
      } finally {
        setIsAnalyzingRS(false);
      }
    },
    [question, satQuery, analysisMode, image1, image2, captureMapSnapshotItem]
  );

  // Feature: Search a Place, Center Map, Take Screenshot, and Add as Image
  const handleSearchAndCapture = useCallback(
    async (
      placeQuery: string,
      targetSlot: "image1" | "image2" = "image1",
      bbox?: [number, number, number, number],
      lat?: number,
      lng?: number
    ) => {
      setIsCapturingMap(true);
      try {
        let snap = null;
        let targetLoc = satQuery.location;

        if (bbox && lat !== undefined && lng !== undefined) {
          // Exact city coordinates & bounds provided from suggestion!
          snap = await captureBoundsSatelliteImage(bbox, placeQuery, lat, lng);
          const cityLoc: LocationMetadata = {
            displayName: placeQuery,
            regionName: placeQuery.split(",")[0].trim(),
            state: placeQuery.split(",")[1]?.trim() || "India",
            country: "India",
            lat,
            lng,
            boundingBox: bbox,
            areaKm2: 0,
            elevationMeters: 0,
            coordinatesDisplay: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
          };
          satQuery.setLocation(cityLoc);
          targetLoc = cityLoc;
        } else {
          // 1. Center map on searched place
          const newLoc = await satQuery.selectRegion(placeQuery);
          targetLoc = newLoc || satQuery.location;

          // 2. Fetch high-res satellite screenshot
          if (targetLoc?.boundingBox) {
            snap = await captureBoundsSatelliteImage(
              targetLoc.boundingBox as [number, number, number, number],
              targetLoc.displayName,
              targetLoc.lat,
              targetLoc.lng
            );
          } else {
            snap = await capturePlaceSatelliteImage(placeQuery);
          }
        }

        const dataUrl = snap?.dataUrl || "";
        if (dataUrl) {
          const cleanName = (snap?.filename || `${placeQuery.split(",")[0]}_Satellite.png`).replace(/[^a-zA-Z0-9_.-]/g, "_");
          const file = dataUrlToFile(dataUrl, cleanName);
          const info: UploadedImageInfo = {
            file,
            previewUrl: dataUrl,
            filename: cleanName,
            format: snap?.format || "PNG",
            source: `${snap?.source || "Satellite"} (${targetLoc?.displayName || placeQuery})`,
            bounds: snap?.bounds || (targetLoc?.boundingBox ? (targetLoc.boundingBox as [number, number, number, number]) : undefined),
          };

          if (targetSlot === "image2") {
            setImage2(info);
          } else {
            setImage1(info);
          }
        }
      } catch (err) {
        console.error("Failed to search and capture map:", err);
      } finally {
        setIsCapturingMap(false);
      }
    },
    [satQuery]
  );

  const handleResetQuery = useCallback(() => {
    setQuestion("");
    satQuery.setInput("");
    setImage1(null);
    setImage2(null);
    setRsResult(null);
    setFocusedBoxId(null);
    satQuery.setAnswer("Submit a question or upload remote-sensing imagery to begin analysis.");
  }, [satQuery]);

  // Capture Current Map View directly — captures whichever part of the map is currently zoomed into
  const handleCaptureCurrentView = useCallback(
    async (targetSlot: "image1" | "image2" = "image1") => {
      setIsCapturingMap(true);
      try {
        const info = await captureMapSnapshotItem();
        if (info) {
          setActiveTab("ask");
          if (!question.trim()) {
            const placeName = satQuery.location?.displayName || "this area";
            const promptText = `Analyze land use, building structures, water bodies, and vegetation in this zoomed-in satellite area of ${placeName}.`;
            setQuestion(promptText);
            satQuery.setInput(promptText);
          }
          if (targetSlot === "image2") {
            setImage2(info);
          } else {
            setImage1(info);
          }
        }
      } finally {
        setIsCapturingMap(false);
      }
    },
    [captureMapSnapshotItem, question, satQuery]
  );

  const renderLeftPanel = () => {
    switch (activeTab) {
      case "recent":
        return (
          <RecentQueries
            queries={satQuery.recentQueries}
            onSelectQuery={(q) => {
              setQuestion(q);
              satQuery.setInput(q);
              setActiveTab("ask");
              handleRunAnalysis(q);
            }}
          />
        );
      case "saved":
        return (
          <SavedResults
            onSelectQuery={(q) => {
              setQuestion(q);
              satQuery.setInput(q);
              setActiveTab("ask");
              handleRunAnalysis(q);
            }}
          />
        );
      case "settings":
        return <SettingsPanel onClose={() => setActiveTab("ask")} />;
      default:
        return (
          <InputAnalysisPanel
            mode={analysisMode}
            onModeChange={(newMode) => {
              setAnalysisMode(newMode);
              if (newMode === "before_after") {
                setCenterViewMode("before_after");
              }
            }}
            image1={image1}
            image2={image2}
            onImage1Change={setImage1}
            onImage2Change={setImage2}
            location={satQuery.location}
            onSearchAndCapture={handleSearchAndCapture}
            onCaptureCurrentView={handleCaptureCurrentView}
            isCapturingSnapshot={isCapturingMap}
            question={question}
            onQuestionChange={(q) => {
              setQuestion(q);
              satQuery.setInput(q);
            }}
            onAnalyze={() => handleRunAnalysis()}
            onResetQuery={handleResetQuery}
            isProcessing={isAnalyzingRS || satQuery.isProcessing}
          />
        );
    }
  };

  return (
    <main className="app-shell">
      {/* Top Header with Live Clock, Date Widget & Settings */}
      <TopBar
        location={satQuery.location}
        onLocationSelect={satQuery.selectRegion}
        onOpenSettings={() => setActiveTab("settings")}
      />

      <div className="dashboard-grid rs-grid-layout">
        {/* Left sidebar nav icons */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Left Stack: INPUT & ANALYSIS */}
        <aside className="left-stack rs-left-stack">
          {renderLeftPanel()}
        </aside>

        {/* Center: MAPPLS / BEFORE & AFTER SWIPE / CHANGE MAP (Sections 30 & 31 of masterprompt.md) */}
        <div className="center-viewport-wrapper">
          {/* Viewport Mode Switcher */}
          <div className="center-viewport-mode-strip">
            <div className="center-mode-buttons">
              <button
                type="button"
                className={`center-mode-tab-btn ${centerViewMode === "map" ? "active" : ""}`}
                onClick={() => setCenterViewMode("map")}
                title="Standard Interactive Satellite Map"
              >
                <MapIcon size={13} />
                <span>Map</span>
              </button>
              <button
                type="button"
                className={`center-mode-tab-btn ${centerViewMode === "before_after" ? "active" : ""}`}
                onClick={() => setCenterViewMode("before_after")}
                title="Bi-Temporal Before & After Swipe Comparison"
              >
                <Sparkles size={13} />
                <span>Before / After</span>
              </button>
              <button
                type="button"
                className={`center-mode-tab-btn ${centerViewMode === "change_map" ? "active" : ""}`}
                onClick={() => setCenterViewMode("change_map")}
                title="Thematic Change Detection & Spectral Indices Overlay"
              >
                <Layers size={13} />
                <span>Change Map</span>
              </button>
            </div>
          </div>

          {/* Conditional Center Viewports */}
          {centerViewMode === "before_after" ? (
            <BeforeAfterSwipeViewer
              image1={image1}
              image2={image2}
              location={satQuery.location}
              onCaptureSlot={handleCaptureCurrentView}
              isCapturing={isCapturingMap}
            />
          ) : centerViewMode === "change_map" ? (
            <ChangeMapView
              location={satQuery.location}
              rsResult={rsResult}
              image1={image1}
              image2={image2}
            />
          ) : (
            <SatelliteMap
              location={satQuery.location}
              activeLayerSet={satQuery.activeLayerSet}
              features={satQuery.features}
              isProcessing={isAnalyzingRS || satQuery.isProcessing}
              imageBounds={rsResult?.image_1?.bounds || (image1?.bounds as any) || null}
              imagePreviewUrl={image1?.previewUrl || rsResult?.image_1?.thumbnail || null}
              groundingBoxes={rsResult?.grounding_boxes}
              waterPolygons={rsResult?.water_polygons}
              detectedBuildings={rsResult?.detected_buildings}
              analysisBoundary={rsResult?.analysis_boundary}
              focusedBoxId={focusedBoxId}
              onMapReady={(map) => {
                leafletMapRef.current = map;
              }}
            />
          )}
        </div>

        {/* Right Stack: IMAGE ANNOTATION VIEWER */}
        <aside className="right-stack rs-right-stack">
          <ImageAnnotationViewer
            rsResult={rsResult}
            image1={image1}
            image2={image2}
            location={satQuery.location}
            isProcessing={isAnalyzingRS || satQuery.isProcessing}
            onRequestCapture={() => handleCaptureCurrentView("image1")}
          />
        </aside>

        {/* Bottom Panel: AUDITABLE EXECUTION TRACE & REPORT */}
        <AgenticResponseWorkspace
          answer={rsResult?.answer || satQuery.answer}
          detailedReport={rsResult?.detailed_report || satQuery.detailedReport}
          analysis={satQuery.analysis}
          location={satQuery.location}
          highlights={satQuery.highlights}
          suggestions={satQuery.suggestedQueries}
          isProcessing={isAnalyzingRS || satQuery.isProcessing}
          error={satQuery.error}
          onSelectSuggestion={(q) => {
            setQuestion(q);
            setAnalysisMode("single_image");
            handleRunAnalysis(q);
          }}
          onSubmit={(customQ) => {
            if (customQ) setQuestion(customQ);
            handleRunAnalysis(customQ);
          }}
        />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
};

export default App;
