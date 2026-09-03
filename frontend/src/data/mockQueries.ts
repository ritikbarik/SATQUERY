import type { QueryIntent, RecentQuery } from "../types/satquery";

export const suggestedQueries: Array<{ text: string; intent: QueryIntent }> = [
  { text: "Find water bodies near Chilika Lake", intent: "water-bodies" },
  { text: "NDVI vegetation analysis for Punjab", intent: "ndvi" },
  { text: "Urban expansion in Pune", intent: "construction-growth" },
  { text: "Weather and forest cover in Western Ghats", intent: "weather" },
  { text: "Would you say that any arable land lies next to pastures?", intent: "vqa" },
  { text: "Is any portion of the image covered by mixed forest?", intent: "vqa" },
  { text: "Urban growth and NDBI analysis in Bengaluru", intent: "built-up" },
  { text: "Show vegetation loss between 2024 and 2026", intent: "vegetation-loss" },
];

export const initialRecentQueries: RecentQuery[] = [
  {
    id: "recent-1",
    text: "Find water bodies near Chilika Lake",
    timestamp: "Today, 10:20 AM",
    intent: "water-bodies",
    location: "Chilika Lake, Odisha, India",
  },
  {
    id: "recent-2",
    text: "NDVI vegetation analysis for Punjab",
    timestamp: "Today, 09:45 AM",
    intent: "ndvi",
    location: "Punjab, India",
  },
  {
    id: "recent-3",
    text: "Would you say that any arable land lies next to pastures?",
    timestamp: "Yesterday, 06:30 PM",
    intent: "vqa",
    location: "Austria (BigEarthNet Sentinel-2)",
  },
];
