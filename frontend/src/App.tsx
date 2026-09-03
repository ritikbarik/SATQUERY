import { useState } from "react";
import { AssistantPanel } from "./components/ai/AssistantPanel";
import { HeroQuery } from "./components/ai/HeroQuery";
import { BottomNav } from "./components/layout/BottomNav";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { SatelliteMap } from "./components/map/SatelliteMap";
import { AnalysisSummary } from "./components/panels/AnalysisSummary";
import { AreaInformation } from "./components/panels/AreaInformation";
import { RecentQueries } from "./components/panels/RecentQueries";
import { SavedResults } from "./components/panels/SavedResults";
import { SettingsPanel } from "./components/panels/SettingsPanel";
import { WeatherCard } from "./components/panels/WeatherCard";
import { useSatQuery } from "./hooks/useSatQuery";
import { Compass, Eye, Radio, ShieldCheck } from "lucide-react";

export type SidebarTab = "ask" | "recent" | "saved" | "settings";

const App = () => {
  const satQuery = useSatQuery();
  const [activeTab, setActiveTab] = useState<SidebarTab>("ask");
  const [hideMap, setHideMap] = useState<boolean>(false);

  const renderLeftPanel = () => {
    switch (activeTab) {
      case "recent":
        return (
          <RecentQueries
            queries={satQuery.recentQueries}
            onSelectQuery={(q) => {
              satQuery.runQuery(q);
              setActiveTab("ask");
            }}
          />
        );
      case "saved":
        return <SavedResults />;
      case "settings":
        return (
          <SettingsPanel
            hideMap={hideMap}
            onToggleHideMap={() => setHideMap(!hideMap)}
          />
        );
      default:
        return (
          <AreaInformation
            location={satQuery.location}
            analysis={satQuery.analysis}
          />
        );
    }
  };

  return (
    <main className="app-shell">
      <TopBar
        location={satQuery.location}
        onLocationSelect={satQuery.selectRegion}
        onOpenSettings={() => setActiveTab("settings")}
        hideMap={hideMap}
        onToggleHideMap={() => setHideMap(!hideMap)}
      />

      <div className="dashboard-grid">
        {/* Left sidebar nav */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Left content panel */}
        <aside className="left-stack">
          {renderLeftPanel()}
        </aside>

        {/* Central viewport with Highlighted Middle Hero Query */}
        <div className={`center-viewport-wrapper ${hideMap ? "map-hidden-mode" : ""}`}>
          {/* Main Hero Query centered right in the middle */}
          <HeroQuery
            value={satQuery.input}
            onChange={satQuery.setInput}
            onSubmit={(customQ) => satQuery.runQuery(customQ || satQuery.input)}
            isProcessing={satQuery.isProcessing}
            suggestions={satQuery.suggestedQueries}
            onSelectSuggestion={satQuery.selectSuggestion}
          />

          {!hideMap ? (
            <SatelliteMap
              location={satQuery.location}
              activeLayerSet={satQuery.activeLayerSet}
              features={satQuery.features}
              isProcessing={satQuery.isProcessing}
              onHideMap={() => setHideMap(true)}
            />
          ) : (
            /* Dedicated Data Focus Mode when Map is Hidden */
            <div className="data-focus-console">
              <div className="data-focus-header">
                <div className="data-focus-region">
                  <div className="data-focus-badge">
                    <Radio size={14} className="pulse-radio" />
                    <span>Telemetry Data Focus Mode</span>
                  </div>
                  <h2>{satQuery.location?.displayName || "India (Subcontinent)"}</h2>
                  <p>
                    <Compass size={13} />
                    <span>{satQuery.location?.coordinatesDisplay || "20.2961° N, 85.8245° E"}</span>
                    &bull;
                    <span>Area: {satQuery.location?.areaKm2 ? Number(satQuery.location.areaKm2).toLocaleString() + " km²" : "Active Bounding Box"}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="restore-map-btn"
                  onClick={() => setHideMap(false)}
                >
                  <Eye size={16} />
                  <span>Show Satellite Map</span>
                </button>
              </div>

              {/* Spectral Telemetry Cards Grid */}
              <div className="data-focus-grid">
                <div className="data-telemetry-card">
                  <div className="card-top">
                    <span className="telemetry-label">🌿 NDVI Canopy Health</span>
                    <span className="telemetry-val green">{satQuery.analysis.meanNdvi?.toFixed(3) ?? "0.612"}</span>
                  </div>
                  <div className="telemetry-progress-track">
                    <div
                      className="telemetry-progress-fill green"
                      style={{ width: `${Math.min(100, Math.max(0, ((satQuery.analysis.meanNdvi ?? 0.6) + 0.2) * 100))}%` }}
                    />
                  </div>
                  <small>Healthy vegetation canopy index (Sentinel-2 B8/B4)</small>
                </div>

                <div className="data-telemetry-card">
                  <div className="card-top">
                    <span className="telemetry-label">💧 NDWI Water Extraction</span>
                    <span className="telemetry-val blue">{satQuery.analysis.ndwi?.toFixed(3) ?? "0.284"}</span>
                  </div>
                  <div className="telemetry-progress-track">
                    <div
                      className="telemetry-progress-fill blue"
                      style={{ width: `${Math.min(100, Math.max(0, ((satQuery.analysis.ndwi ?? 0.3) + 0.3) * 80))}%` }}
                    />
                  </div>
                  <small>Normalized Difference Water Index &amp; moisture</small>
                </div>

                <div className="data-telemetry-card">
                  <div className="card-top">
                    <span className="telemetry-label">🏗️ NDBI Built-Up Index</span>
                    <span className="telemetry-val purple">{satQuery.analysis.ndbi?.toFixed(3) ?? "0.128"}</span>
                  </div>
                  <div className="telemetry-progress-track">
                    <div
                      className="telemetry-progress-fill purple"
                      style={{ width: `${Math.min(100, Math.max(0, ((satQuery.analysis.ndbi ?? 0.12) + 0.3) * 70))}%` }}
                    />
                  </div>
                  <small>Urban concrete &amp; structural impervious density</small>
                </div>

                <div className="data-telemetry-card">
                  <div className="card-top">
                    <span className="telemetry-label">🛰️ Sentinel-1 SAR Telemetry</span>
                    <span className="telemetry-val amber">{satQuery.analysis.opticalSarConfidence ? `${satQuery.analysis.opticalSarConfidence}%` : "0.74"}</span>
                  </div>
                  <div className="telemetry-progress-track">
                    <div
                      className="telemetry-progress-fill amber"
                      style={{ width: `${satQuery.analysis.opticalSarConfidence ?? 74}%` }}
                    />
                  </div>
                  <small>C-band radar backscatter coherence &amp; fusion</small>
                </div>
              </div>

              {/* Detected Land Cover Metrics breakdown */}
              <div className="data-focus-metrics-row">
                {satQuery.analysis.metrics.map((m) => (
                  <div key={m.label} className={`data-metric-pill ${m.tone}`}>
                    <span className="metric-tag">{m.label}</span>
                    <strong className="metric-num">{m.value}</strong>
                  </div>
                ))}
              </div>

              <div className="data-focus-footer">
                <div className="data-source-pill">
                  <ShieldCheck size={14} className="green" />
                  <span>ArcGIS World Imagery &bull; Copernicus Sentinel-1/2 &bull; BigEarthNet EO</span>
                </div>
                <span className="confidence-tag">
                  Analysis Confidence: <strong>{satQuery.analysis.confidence}%</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel stack */}
        <aside className="right-stack">
          <WeatherCard
            weather={satQuery.weather}
            onRefresh={satQuery.refreshWeather}
            isProcessing={satQuery.isProcessing}
          />
          <AnalysisSummary
            analysis={satQuery.analysis}
            isProcessing={satQuery.isProcessing}
          />
        </aside>

        {/* Bottom assistant panel */}
        <AssistantPanel
          input={satQuery.input}
          setInput={satQuery.setInput}
          suggestions={satQuery.suggestedQueries}
          isProcessing={satQuery.isProcessing}
          error={satQuery.error}
          answer={satQuery.answer}
          highlights={satQuery.highlights}
          location={satQuery.location}
          onSelectSuggestion={satQuery.selectSuggestion}
          onSubmit={(customQ) => satQuery.runQuery(customQ || satQuery.input)}
        />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
};

export default App;
