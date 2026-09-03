import type { AnalysisResult, AreaInformation, WeatherData } from "../types/satquery";

export const areaInformation: AreaInformation = {
  location: "Odisha, India",
  area: "142.6 km²",
  coordinates: "20.2961° N, 85.8245° E",
  vegetationCover: "63.4%",
  waterBodies: "17",
  builtUpArea: "12.8%",
  elevation: "158 m",
};

export const weatherData: WeatherData = {
  temperature: 28,
  condition: "Partly Cloudy",
  humidity: 64,
  wind: "12 km/h",
  cloudCover: 12,
  soilMoisture: 28.5,
  uvIndex: 5.5,
  precipitationMm: 0.0,
  updatedAt: "10:15 AM",
  isLive: true,
};

export const analysisByIntent: Record<string, AnalysisResult> = {
  default: {
    intent: "vegetation-loss",
    title: "Baseline area scan",
    confidence: 91,
    activeLayers: ["vegetation", "water", "built"],
    metrics: [
      { label: "Water Bodies", value: "37 detected", tone: "water" },
      { label: "Vegetation Cover", value: "63.4%", tone: "vegetation" },
      { label: "Built-up Area", value: "12.8%", tone: "built" },
      { label: "Vegetation Change (2024-2026)", value: "-18.4%", tone: "decrease" },
    ],
  },
  "vegetation-loss": {
    intent: "vegetation-loss",
    title: "Vegetation loss detected",
    confidence: 91,
    activeLayers: ["vegetation", "decrease"],
    metrics: [
      { label: "Loss Hotspots", value: "9 clusters", tone: "decrease" },
      { label: "Vegetation Cover", value: "63.4%", tone: "vegetation" },
      { label: "Affected Area", value: "26.2 km²", tone: "decrease" },
      { label: "Vegetation Change (2024-2026)", value: "-18.4%", tone: "decrease" },
    ],
  },
  "water-bodies": {
    intent: "water-bodies",
    title: "Water body extraction",
    confidence: 88,
    activeLayers: ["water"],
    metrics: [
      { label: "Water Bodies", value: "43 detected", tone: "water" },
      { label: "Seasonal Ponds", value: "11 likely", tone: "water" },
      { label: "Water Coverage", value: "9.7 km²", tone: "water" },
      { label: "Nearest Cluster", value: "2.4 km east", tone: "increase" },
    ],
  },
  "construction-growth": {
    intent: "construction-growth",
    title: "Built-up expansion",
    confidence: 86,
    activeLayers: ["built", "increase"],
    metrics: [
      { label: "Built-up Area", value: "15.6%", tone: "built" },
      { label: "New Construction", value: "+3.1 km²", tone: "increase" },
      { label: "Growth Corridors", value: "5 detected", tone: "built" },
      { label: "Vegetation Conversion", value: "4.8 km²", tone: "decrease" },
    ],
  },
};
