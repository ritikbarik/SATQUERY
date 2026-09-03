import React, { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Globe2, Layers, Map as MapIcon, Moon, Sliders, Sun, User } from "lucide-react";

type ThemeMode = "light" | "dark" | "comfort";

interface SettingsPanelProps {
  hideMap?: boolean;
  onToggleHideMap?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ hideMap = false, onToggleHideMap }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("satquery_theme") as ThemeMode) || "light";
  });
  const [defaultRegion, setDefaultRegion] = useState(() => {
    return localStorage.getItem("satquery_default_region") || "Odisha, India";
  });
  const [spectralMode, setSpectralMode] = useState("NDVI (Canopy Health)");
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState(true);

  // Apply theme to document element
  const handleThemeChange = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    localStorage.setItem("satquery_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("satquery_theme") as ThemeMode) || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <div className="settings-panel glass-card">
      <div className="card-title">
        <Sliders size={16} />
        <span>Settings &amp; Preferences</span>
      </div>

      <div className="settings-body">
        {/* ===================================================================
            1. OPERATOR PROFILE
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Active Analyst Profile</div>
          <div className="settings-profile-card">
            <div className="settings-avatar">
              <User size={20} />
            </div>
            <div className="settings-profile-info">
              <strong>Geospatial Intelligence Analyst</strong>
              <small>Operator Session (Local Workspace)</small>
            </div>
          </div>
        </div>

        {/* ===================================================================
            2. MAP VISIBILITY (HIDE MAP OPTION)
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Map Display Controls</div>
          <div className="settings-toggle-row">
            <div>
              <strong>Hide Satellite Map</strong>
              <small>{hideMap ? "Map is currently hidden (Data Focus Mode)" : "ArcGIS imagery is visible"}</small>
            </div>
            <button
              type="button"
              className={`hide-map-pill-btn ${hideMap ? "hidden-active" : ""}`}
              onClick={onToggleHideMap}
              title={hideMap ? "Show Satellite Map" : "Hide Satellite Map"}
            >
              {hideMap ? (
                <>
                  <EyeOff size={14} />
                  <span>Map Hidden</span>
                </>
              ) : (
                <>
                  <MapIcon size={14} />
                  <span>Map Shown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===================================================================
            3. THEME CUSTOMIZATION
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Color Theme &amp; Eye Comfort</div>
          <div className="theme-toggle-group">
            <button
              className={`theme-card-btn ${currentTheme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              <div className="theme-icon light">
                <Sun size={18} />
              </div>
              <div className="theme-meta">
                <strong>Subtle Light</strong>
                <small>Soft sage, gentle on eyes</small>
              </div>
              {currentTheme === "light" && <Check size={14} className="theme-check" />}
            </button>

            <button
              className={`theme-card-btn ${currentTheme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              <div className="theme-icon dark">
                <Moon size={18} />
              </div>
              <div className="theme-meta">
                <strong>Dark Satellite</strong>
                <small>Night-ops deep obsidian</small>
              </div>
              {currentTheme === "dark" && <Check size={14} className="theme-check" />}
            </button>

            <button
              className={`theme-card-btn ${currentTheme === "comfort" ? "active" : ""}`}
              onClick={() => handleThemeChange("comfort")}
            >
              <div className="theme-icon comfort">
                <Eye size={18} />
              </div>
              <div className="theme-meta">
                <strong>Eye Comfort</strong>
                <small>Warm paper sepia tone</small>
              </div>
              {currentTheme === "comfort" && <Check size={14} className="theme-check" />}
            </button>
          </div>
        </div>

        {/* ===================================================================
            4. OBSERVATION & SATELLITE PREFERENCES
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Default Observation Region</div>
          <div className="settings-select-wrap">
            <Globe2 size={15} />
            <select
              value={defaultRegion}
              onChange={(e) => {
                setDefaultRegion(e.target.value);
                localStorage.setItem("satquery_default_region", e.target.value);
              }}
            >
              <option value="Odisha, India">Odisha, India (Chilika Lake)</option>
              <option value="Delhi NCR, India">Delhi NCR, India</option>
              <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
              <option value="Mumbai, Maharashtra">Mumbai, Maharashtra</option>
              <option value="Kerala, India">Kerala, India</option>
              <option value="Punjab, India">Punjab, India</option>
              <option value="Western Ghats, India">Western Ghats, India</option>
              <option value="Sundarbans, West Bengal">Sundarbans, West Bengal</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-label">Spectral Index Default</div>
          <div className="settings-select-wrap">
            <Layers size={15} />
            <select value={spectralMode} onChange={(e) => setSpectralMode(e.target.value)}>
              <option>NDVI (Canopy Health &amp; Vegetation)</option>
              <option>NDWI (Water Extraction &amp; Wetlands)</option>
              <option>NDBI (Built-Up &amp; Urban Concrete)</option>
              <option>Sentinel-1 SAR C-Band Backscatter</option>
            </select>
          </div>
        </div>

        {/* Telemetry toggle */}
        <div className="settings-section">
          <div className="settings-section-label">Real-time Telemetry Sync</div>
          <div className="settings-toggle-row">
            <div>
              <strong>Open-Meteo Weather Sync</strong>
              <small>Continuous atmospheric telemetry</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoRefreshTelemetry}
                onChange={() => setAutoRefreshTelemetry(!autoRefreshTelemetry)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
