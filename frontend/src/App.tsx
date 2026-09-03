import { useState } from "react";
import { AssistantPanel } from "./components/ai/AssistantPanel";
import { BottomNav } from "./components/layout/BottomNav";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { SatelliteMap } from "./components/map/SatelliteMap";
import { AnalysisSummary } from "./components/panels/AnalysisSummary";
import { AreaInformation } from "./components/panels/AreaInformation";
import { RecentQueries } from "./components/panels/RecentQueries";
import { SavedResults } from "./components/panels/SavedResults";
import { WeatherCard } from "./components/panels/WeatherCard";
import { useSatQuery } from "./hooks/useSatQuery";

export type SidebarTab = "ask" | "recent" | "saved" | "settings" | "help";

const App = () => {
  const satQuery = useSatQuery();
  const [activeTab, setActiveTab] = useState<SidebarTab>("ask");

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
          <div className="settings-panel glass-card">
            <div className="card-title">
              <span>Settings</span>
            </div>
            <div className="settings-body">
              <p className="muted">Settings and preferences coming soon.</p>
            </div>
          </div>
        );
      case "help":
        return (
          <div className="help-panel glass-card">
            <div className="card-title">
              <span>Help & Support</span>
            </div>
            <div className="settings-body">
              <p className="muted">Documentation and help resources.</p>
            </div>
          </div>
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
      />
      <div className="dashboard-grid">
        {/* Left sidebar nav */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Left content panel */}
        <aside className="left-stack">
          {renderLeftPanel()}
        </aside>

        {/* Central map */}
        <SatelliteMap
          location={satQuery.location}
          activeLayerSet={satQuery.activeLayerSet}
          features={satQuery.features}
          isProcessing={satQuery.isProcessing}
        />

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
