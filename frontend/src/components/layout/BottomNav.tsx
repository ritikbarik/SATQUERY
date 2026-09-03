import React from "react";
import { CircleHelp, Clock3, MessageSquareText, Settings, Star } from "lucide-react";
import type { SidebarTab } from "../../App";

interface BottomNavProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const items: Array<{ label: string; icon: React.FC<{ size: number }>; tab: SidebarTab }> = [
  { label: "Ask", icon: MessageSquareText, tab: "ask" },
  { label: "Recent", icon: Clock3, tab: "recent" },
  { label: "Saved", icon: Star, tab: "saved" },
  { label: "Settings", icon: Settings, tab: "settings" },
  { label: "Help", icon: CircleHelp, tab: "help" },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => (
  <nav className="bottom-nav" aria-label="Mobile navigation">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.tab}
          className={activeTab === item.tab ? "active" : ""}
          onClick={() => onTabChange(item.tab)}
          aria-label={item.label}
        >
          <Icon size={18} />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);
