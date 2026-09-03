import React from "react";
import { Clock3, MessageSquareText, Settings, Star } from "lucide-react";
import type { SidebarTab } from "../../App";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const items: Array<{ label: string; icon: React.FC<{ size: number }>; tab: SidebarTab }> = [
  { label: "Ask SatQuery", icon: MessageSquareText, tab: "ask" },
  { label: "Recent Queries", icon: Clock3, tab: "recent" },
  { label: "Saved Results", icon: Star, tab: "saved" },
  { label: "Settings", icon: Settings, tab: "settings" },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => (
  <nav className="side-nav" aria-label="Primary">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.tab}
          className={activeTab === item.tab ? "active" : ""}
          onClick={() => onTabChange(item.tab)}
          title={item.label}
          aria-label={item.label}
        >
          <Icon size={20} />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);
