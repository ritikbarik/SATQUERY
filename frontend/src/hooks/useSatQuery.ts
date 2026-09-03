import { useCallback, useEffect, useMemo, useState } from "react";
import { submitSatQuery, fetchWeatherData } from "../services/satQueryApi";
import type {
  AnalysisResult,
  GeoFeature,
  LocationMetadata,
  QueryIntent,
  RecentQuery,
  WeatherData,
} from "../types/satquery";

const DEFAULT_LOCATION: LocationMetadata = {
  displayName: "Odisha, India",
  regionName: "Odisha",
  state: "Odisha",
  country: "India",
  lat: 20.2961,
  lng: 85.8245,
  boundingBox: [17.78, 22.57, 81.37, 87.53],
  areaKm2: 155707.0,
  elevationMeters: 158,
  coordinatesDisplay: "20.2961° N, 85.8245° E",
};

const DEFAULT_WEATHER: WeatherData = {
  temperature: 28.4,
  condition: "Partly Cloudy",
  humidity: 64,
  wind: "12 km/h",
  cloudCover: 18,
  soilMoisture: 28.5,
  uvIndex: 5.5,
  precipitationMm: 0.0,
  updatedAt: "Just now",
  isLive: true,
};

const DEFAULT_ANALYSIS: AnalysisResult = {
  intent: "vegetation-loss",
  title: "Vegetation Canopy Analysis - Odisha",
  metrics: [
    { label: "Water Bodies", value: "37 detected", tone: "water" },
    { label: "Vegetation Cover", value: "63.4%", tone: "vegetation" },
    { label: "Built-up Area", value: "12.8%", tone: "built" },
    { label: "Vegetation Change", value: "-18.4%", tone: "decrease" },
  ],
  confidence: 91,
  activeLayers: ["vegetation", "water", "built", "decrease"],
  meanNdvi: 0.61,
  ndwi: 0.28,
  soilMoisture: 28.5,
};

export const useSatQuery = () => {
  const [input, setInput] = useState("");
  const [location, setLocation] = useState<LocationMetadata>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [analysis, setAnalysis] = useState<AnalysisResult>(DEFAULT_ANALYSIS);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [highlights, setHighlights] = useState<string[]>([
    "Odisha",
    "63.4% Vegetation",
    "-18.4% reduction",
    "37 water bodies",
  ]);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([
    {
      id: "1",
      text: "Show vegetation loss between 2024 and 2026",
      timestamp: "10:15 AM",
      intent: "vegetation-loss",
      location: "Odisha, India",
    },
    {
      id: "2",
      text: "Find water bodies near Chilika lake",
      timestamp: "09:42 AM",
      intent: "water-bodies",
      location: "Chilika, Odisha",
    },
    {
      id: "3",
      text: "Where has construction increased in Bengaluru?",
      timestamp: "Yesterday",
      intent: "construction-growth",
      location: "Bengaluru, Karnataka",
    },
  ]);
  const [answer, setAnswer] = useState(
    "Welcome to SatQuery AI. Ask me anything about environmental change, water extraction, urban expansion, NDVI indices, or live weather across India."
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLayerSet = useMemo(() => new Set(analysis.activeLayers), [analysis]);

  // Dynamic regional suggestions
  const suggestedQueries = useMemo(() => {
    const reg = location.regionName || "India";
    return [
      { text: `Find water bodies in ${reg}`, intent: "water-bodies" as QueryIntent },
      { text: `Show vegetation change in ${reg} (2024-2026)`, intent: "vegetation-loss" as QueryIntent },
      { text: `Where has construction increased in ${reg}?`, intent: "construction-growth" as QueryIntent },
      { text: `Compute NDVI canopy health for ${reg}`, intent: "ndvi" as QueryIntent },
      { text: `Live weather and topsoil moisture in ${reg}`, intent: "weather" as QueryIntent },
    ];
  }, [location.regionName]);

  const runQuery = useCallback(
    async (queryText = input, targetLocation = location.displayName) => {
      const trimmed = queryText.trim();
      if (!trimmed || isProcessing) return;

      setInput(trimmed);
      setError(null);
      setIsProcessing(true);

      try {
        const response = await submitSatQuery({
          question: trimmed,
          location: targetLocation,
        });

        setAnalysis(response.analysis);
        setFeatures(response.features);
        if (response.location) {
          setLocation(response.location);
        }
        if (response.weather) {
          setWeather(response.weather);
        }
        setHighlights(response.highlights || []);
        setAnswer(response.assistantMessage);

        setRecentQueries((items) => [
          response.recentQuery,
          ...items.filter((item) => item.text !== response.recentQuery.text),
        ].slice(0, 6));
      } catch (err) {
        console.error("Query failed:", err);
        setError("Connection issue with intelligence engine. Please retry.");
      } finally {
        setIsProcessing(false);
        setInput("");
      }
    },
    [input, isProcessing, location.displayName]
  );

  const selectSuggestion = useCallback(
    (queryText: string) => {
      setInput(queryText);
      runQuery(queryText);
    },
    [runQuery]
  );

  const selectRegion = useCallback(
    async (regionName: string) => {
      setIsProcessing(true);
      try {
        const response = await submitSatQuery({
          question: `Show satellite intelligence and baseline metrics for ${regionName}`,
          location: regionName,
        });
        setLocation(response.location);
        setWeather(response.weather);
        setAnalysis(response.analysis);
        setFeatures(response.features);
        setHighlights(response.highlights || []);
        setAnswer(response.assistantMessage);
      } catch (err) {
        console.error("Failed to select region:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const refreshWeather = useCallback(async () => {
    if (!location.lat || !location.lng) return;
    try {
      const updatedWeather = await fetchWeatherData(location.lat, location.lng);
      setWeather(updatedWeather);
    } catch (err) {
      console.error("Failed to refresh weather:", err);
    }
  }, [location.lat, location.lng]);

  // Initial load
  useEffect(() => {
    runQuery("Show satellite intelligence baseline for Odisha, India", "Odisha, India");
  }, []);

  return {
    input,
    setInput,
    location,
    weather,
    analysis,
    features,
    highlights,
    answer,
    recentQueries,
    isProcessing,
    error,
    activeLayerSet,
    suggestedQueries,
    runQuery,
    selectSuggestion,
    selectRegion,
    refreshWeather,
  };
};
