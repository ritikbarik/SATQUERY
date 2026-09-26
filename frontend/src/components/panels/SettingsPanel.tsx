import React, { useEffect, useState } from "react";
import { Check, Eye, Globe2, Layers, Moon, Sliders, Sun } from "lucide-react";

type ThemeMode = "light" | "dark" | "comfort";

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("satquery_theme") as ThemeMode) || "light";
  });
  const [defaultRegion, setDefaultRegion] = useState(() => {
    return localStorage.getItem("satquery_default_region") || "Odisha, India";
  });
  const [spectralMode, setSpectralMode] = useState("NDVI (Canopy Health)");

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
            1. THEME CUSTOMIZATION
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
            2. OBSERVATION & SATELLITE PREFERENCES
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
              <option value="Maharashtra, India">Maharashtra, India (Mumbai / Pune)</option>
              <option value="Karnataka, India">Karnataka, India (Bengaluru)</option>
              <option value="Delhi NCR, India">Delhi NCR, India</option>
              <option value="West Bengal, India">West Bengal, India (Sundarbans)</option>
              <option value="Kerala, India">Kerala, India (Vembanad Lake)</option>
              <option value="Gujarat, India">Gujarat, India (Rann of Kutch)</option>
              <option value="Rajasthan, India">Rajasthan, India (Thar Desert)</option>
              <option value="Assam, India">Assam, India (Brahmaputra Valley)</option>
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
      </div>
    </div>
  );
};
