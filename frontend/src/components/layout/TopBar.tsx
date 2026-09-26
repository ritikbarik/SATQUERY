import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Globe2, MapPin, Search } from "lucide-react";
import type { LocationMetadata } from "../../types/satquery";

interface TopBarProps {
  location?: LocationMetadata;
  onLocationSelect?: (locName: string) => void;
  onOpenSettings?: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar",
  "Chandigarh",
  "Dadra & Nagar Haveli",
  "Delhi NCR",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const TopBar: React.FC<TopBarProps> = ({
  location,
  onLocationSelect,
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [customSearch, setCustomSearch] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    if (showLocationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLocationDropdown]);

  const filteredStates = INDIAN_STATES.filter((st) =>
    st.toLowerCase().includes(customSearch.toLowerCase())
  );

  const handleSelectState = (stateName: string) => {
    onLocationSelect?.(`${stateName}, India`);
    setShowLocationDropdown(false);
    setCustomSearch("");
  };

  return (
    <header className="topbar">
      <div className="brand-cluster">
        <div>
          <h1>
            SAT<span>QUERY AI</span>
          </h1>
          <p>Agentic Remote-Sensing Intelligence</p>
        </div>
      </div>

      {/* Region Selector - Indian States & UTs */}
      <div className="location-selector-wrap" ref={dropdownRef}>
        <button
          className="location-pill-btn"
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          title="Select Indian State"
        >
          <Globe2 size={16} className="cyan animate-pulse" />
          <div className="location-pill-text">
            <small>Selected State / Region</small>
            <strong>{location?.regionName || location?.displayName || "All-India Overview"}</strong>
          </div>
          <ChevronDown size={15} />
        </button>

        {showLocationDropdown && (
          <div className="location-dropdown-panel">
            <div className="location-search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Filter Indian states..."
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="dropdown-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Indian States &amp; Territories</span>
              <small style={{ opacity: 0.7 }}>{filteredStates.length} states</small>
            </div>
            <div className="dropdown-region-grid">
              {filteredStates.map((stateName) => {
                const isActive =
                  location?.regionName?.toLowerCase() === stateName.toLowerCase() ||
                  location?.displayName?.toLowerCase().includes(stateName.toLowerCase());
                return (
                  <button
                    key={stateName}
                    className={`region-chip ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectState(stateName)}
                  >
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span>{stateName}</span>
                  </button>
                );
              })}
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
    </header>
  );
};
