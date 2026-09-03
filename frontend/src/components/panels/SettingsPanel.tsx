import React, { useEffect, useState } from "react";
import { Check, Eye, Globe2, Layers, LogIn, LogOut, Moon, Palette, ShieldCheck, Sun, User, UserCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type ThemeMode = "light" | "dark" | "comfort";

export const SettingsPanel: React.FC = () => {
  const { user, signInWithGoogle, signInWithGitHub, signInAsDemo, signOut, isConfigured } = useAuth();
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

  const avatar = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator";
  const email = user?.email || "analyst@satquery.ai";
  const provider = user?.app_metadata?.provider || (user ? "OAuth User" : "Guest");

  return (
    <div className="settings-panel glass-card">
      <div className="card-title">
        <Palette size={16} />
        <span>Settings &amp; Preferences</span>
      </div>

      <div className="settings-body">
        {/* ===================================================================
            1. AUTHENTICATION / USER PROFILE
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Account &amp; Supabase OAuth</div>

          {user ? (
            <div className="settings-auth-logged-in">
              <div className="settings-profile-card">
                <div className="settings-avatar">
                  {avatar ? (
                    <img src={avatar} alt={fullName} referrerPolicy="no-referrer" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="settings-profile-info">
                  <strong>{fullName}</strong>
                  <small>{email}</small>
                  <div className="auth-provider-badge">
                    <UserCheck size={11} />
                    <span>Signed in via {provider}</span>
                  </div>
                </div>
              </div>
              <button className="settings-signout-btn" onClick={signOut}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="settings-auth-box">
              <p className="settings-auth-desc">
                Connect your account via Supabase OAuth to sync search telemetry, export reports, and bookmark regions.
              </p>

              <div className="settings-oauth-buttons">
                <button className="settings-oauth-btn google" onClick={signInWithGoogle}>
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button className="settings-oauth-btn github" onClick={signInWithGitHub}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Sign in with GitHub</span>
                </button>

                <button className="settings-oauth-btn demo" onClick={() => signInAsDemo()}>
                  <LogIn size={15} />
                  <span>Quick Sign In as Demo Operator</span>
                </button>
              </div>

              <div className="supabase-status-pill">
                <ShieldCheck size={12} className={isConfigured ? "configured" : "unconfigured"} />
                <span>{isConfigured ? "Supabase OAuth Connected" : "Supabase: Local Demo Mode"}</span>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            2. THEME CUSTOMIZATION
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
            3. REGIONAL & ANALYSIS PREFERENCES
            =================================================================== */}
        <div className="settings-section">
          <div className="settings-section-label">Observation Region</div>
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
          <div className="settings-section-label">Default Spectral Index</div>
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
          <div className="settings-section-label">Real-time Telemetry</div>
          <div className="settings-toggle-row">
            <div>
              <strong>Live Weather &amp; Soil Sync</strong>
              <small>Auto-refresh Open-Meteo telemetry</small>
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
