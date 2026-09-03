import React, { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Eye, EyeOff, Globe2, MapPin, Menu, Search, Settings, UserRound } from "lucide-react";
import type { LocationMetadata } from "../../types/satquery";

interface TopBarProps {
  location?: LocationMetadata;
  onLocationSelect?: (locName: string) => void;
  onOpenSettings?: () => void;
  hideMap?: boolean;
  onToggleHideMap?: () => void;
}

const POPULAR_REGIONS = [
  "Odisha, India",
  "Chilika Lake, Odisha",
  "Bengaluru, Karnataka",
  "Delhi NCR, India",
  "Mumbai, Maharashtra",
  "Punjab, India",
  "Kerala, India",
  "Western Ghats, India",
  "Hyderabad, Telangana",
  "Kolkata, West Bengal",
  "Jaipur, Rajasthan",
  "Sundarbans, West Bengal",
  "Ladakh, India",
  "Assam, India",
  "Goa, India",
];

export const TopBar: React.FC<TopBarProps> = ({
  location,
  onLocationSelect,
  onOpenSettings,
  hideMap = false,
  onToggleHideMap,
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [customSearch, setCustomSearch] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " IST"
      );
      setCurrentDate(
        now.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearch.trim() && onLocationSelect) {
      onLocationSelect(customSearch.trim());
      setCustomSearch("");
      setShowLocationDropdown(false);
    }
  };

  return (
    <header className="topbar">
      <div className="brand-cluster">
        <button
          className="icon-button large"
          aria-label="Open navigation menu"
          onClick={onOpenSettings}
          title="Open Settings & Preferences"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1>
            SAT<span>QUERY AI</span>
          </h1>
          <p>Pan-India Satellite Intelligence Engine</p>
        </div>
      </div>

      {/* Region Selector */}
      <div className="location-selector-wrap">
        <button
          className="location-pill-btn"
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          title="Select or Search Indian Region"
        >
          <Globe2 size={16} className="cyan animate-pulse" />
          <div className="location-pill-text">
            <small>Active Region (Pan-India)</small>
            <strong>{location?.displayName || "India (Subcontinent)"}</strong>
          </div>
          <ChevronDown size={15} />
        </button>

        {showLocationDropdown && (
          <div className="location-dropdown-panel">
            <form onSubmit={handleCustomSearchSubmit} className="location-search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search any Indian city, state, or river..."
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                autoFocus
              />
              <button type="submit" className="go-btn">Go</button>
            </form>

            <div className="dropdown-label">Popular Indian Regions &amp; States</div>
            <div className="dropdown-region-grid">
              {POPULAR_REGIONS.map((region) => (
                <button
                  key={region}
                  className={`region-chip ${location?.displayName?.includes(region.split(",")[0]) ? "active" : ""}`}
                  onClick={() => {
                    onLocationSelect?.(region);
                    setShowLocationDropdown(false);
                  }}
                >
                  <MapPin size={12} />
                  <span>{region}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hide / Show Map Quick Toggle Button */}
      <button
        type="button"
        className={`topbar-hide-map-btn ${hideMap ? "active-hidden" : ""}`}
        onClick={onToggleHideMap}
        title={hideMap ? "Show Satellite Map" : "Hide Map to focus on Data & Telemetry"}
      >
        {hideMap ? <Eye size={15} /> : <EyeOff size={15} />}
        <span>{hideMap ? "Show Map" : "Hide Map"}</span>
      </button>

      <div className="top-meta">
        <div>
          <CalendarDays size={18} />
          <span>Date</span>
          <strong>{currentDate || "Live Data"}</strong>
        </div>
        <div>
          <Clock3 size={18} />
          <span>Live Clock</span>
          <strong>{currentTime || "IST"}</strong>
        </div>
      </div>

      {/* Operator profile button */}
      <button
        className="user-menu"
        aria-label="Open settings"
        onClick={onOpenSettings}
        title="Open Settings & Color Theme"
      >
        <span className="avatar">
          <UserRound size={18} />
        </span>
        <span>
          <small>Operator</small>
          <strong>Analyst</strong>
        </span>
        <Settings size={14} style={{ marginLeft: "2px", opacity: 0.7 }} />
      </button>
    </header>
  );
};
