import React, { useState } from "react";
import { Bookmark, Download, Star, Trash2 } from "lucide-react";
import { Card } from "../common/Card";

interface SavedItem {
  id: string;
  title: string;
  location: string;
  savedAt: string;
  intent: string;
}

const DEMO_SAVED: SavedItem[] = [
  {
    id: "s1",
    title: "Vegetation Loss Analysis – Odisha",
    location: "Odisha, India",
    savedAt: "24 Aug 2026",
    intent: "vegetation-loss",
  },
  {
    id: "s2",
    title: "Chilika Lake Water Bodies",
    location: "Chilika, Odisha",
    savedAt: "23 Aug 2026",
    intent: "water-bodies",
  },
  {
    id: "s3",
    title: "Bengaluru Urban Expansion",
    location: "Bengaluru, Karnataka",
    savedAt: "22 Aug 2026",
    intent: "construction-growth",
  },
];

const intentColor: Record<string, string> = {
  "vegetation-loss": "#ff6470",
  "water-bodies": "#39b8ff",
  "construction-growth": "#b66cff",
  ndvi: "#88f36d",
  weather: "#ffd84d",
};

export const SavedResults: React.FC = () => {
  const [items, setItems] = useState<SavedItem[]>(DEMO_SAVED);

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Card title="SAVED RESULTS" icon={<Star size={18} />} className="saved-card">
      {items.length === 0 ? (
        <div className="saved-empty">
          <Bookmark size={32} className="muted" />
          <p className="muted">No saved results yet. Run a query and save it here.</p>
        </div>
      ) : (
        <div className="saved-list">
          {items.map((item) => (
            <div key={item.id} className="saved-item">
              <span
                className="saved-dot"
                style={{ background: intentColor[item.intent] ?? "#888" }}
              />
              <div className="saved-info">
                <strong>{item.title}</strong>
                <small>{item.location} · {item.savedAt}</small>
              </div>
              <div className="saved-actions">
                <button
                  className="icon-button-sm"
                  title="Download JSON"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(item, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `satquery_${item.id}.json`;
                    a.click();
                  }}
                >
                  <Download size={14} />
                </button>
                <button
                  className="icon-button-sm danger"
                  title="Delete"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
