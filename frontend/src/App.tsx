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

export type SidebarTab = "ask" | "recent" | "saved" | "settings";

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
        return <SettingsPanel />;
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
      />

      <div className="dashboard-grid">
        {/* Left sidebar nav */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Left content panel */}
        <aside className="left-stack">
          {renderLeftPanel()}
        </aside>

        {/* Central map with Highlighted Middle Hero Query */}
        <div className="center-viewport-wrapper">
          {/* Main Hero Query centered right in the middle */}
          <HeroQuery
            value={satQuery.input}
            onChange={satQuery.setInput}
            onSubmit={(customQ) => satQuery.runQuery(customQ || satQuery.input)}
            isProcessing={satQuery.isProcessing}
            suggestions={satQuery.suggestedQueries}
            onSelectSuggestion={satQuery.selectSuggestion}
          />

          <SatelliteMap
            location={satQuery.location}
            activeLayerSet={satQuery.activeLayerSet}
            features={satQuery.features}
            isProcessing={satQuery.isProcessing}
          />
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
