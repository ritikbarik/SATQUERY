import React, { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Globe2, LogIn, LogOut, MapPin, Menu, Search, Settings, UserRound } from "lucide-react";
import type { LocationMetadata } from "../../types/satquery";
import { useAuth } from "../../contexts/AuthContext";

interface TopBarProps {
  location?: LocationMetadata;
  onLocationSelect?: (locName: string) => void;
  onOpenSettings?: () => void;
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

export const TopBar: React.FC<TopBarProps> = ({ location, onLocationSelect, onOpenSettings }) => {
  const { user, signOut } = useAuth();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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

  const avatar = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest Analyst";
  const userRole = user ? "Verified Operator" : "Demo Mode";

  return (
    <header className="topbar">
      <div className="brand-cluster">
        <button
          className="icon-button large"
          aria-label="Open navigation menu"
          onClick={onOpenSettings}
          title="Open Settings"
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

      {/* User menu with interactive dropdown */}
      <div className="user-menu-wrapper">
        <button
          className="user-menu"
          aria-label="Open user menu"
          onClick={() => setShowUserDropdown(!showUserDropdown)}
        >
          <span className="avatar">
            {avatar ? (
              <img src={avatar} alt={fullName} referrerPolicy="no-referrer" />
            ) : (
              <UserRound size={20} />
            )}
          </span>
          <span>
            <small>{userRole}</small>
            <strong>{fullName}</strong>
          </span>
          <ChevronDown size={15} />
        </button>

        {showUserDropdown && (
          <div className="user-dropdown">
            <button
              onClick={() => {
                setShowUserDropdown(false);
                onOpenSettings?.();
              }}
            >
              <Settings size={15} />
              <span>Settings &amp; Theme</span>
            </button>
            {user ? (
              <button
                className="danger"
                onClick={() => {
                  setShowUserDropdown(false);
                  signOut();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onOpenSettings?.();
                }}
              >
                <LogIn size={15} />
                <span>Sign In with OAuth</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
