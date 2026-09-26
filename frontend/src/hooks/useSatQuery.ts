import { useCallback, useMemo, useState } from "react";
import { submitSatQuery, fetchWeatherData } from "../services/satQueryApi";
import type {
  AgentDetailedReport,
  AnalysisResult,
  GeoFeature,
  LocationMetadata,
  QueryIntent,
  RecentQuery,
  WeatherData,
} from "../types/satquery";

const DEFAULT_LOCATION: LocationMetadata = {
  displayName: "All-India Overview",
  regionName: "India",
  state: "",
  country: "India",
  lat: 22.5,
  lng: 82.0,
  boundingBox: [8.0, 37.0, 68.0, 97.0],
  areaKm2: 3287263.0,
  elevationMeters: 160,
  coordinatesDisplay: "22.5000° N, 82.0000° E",
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
  intent: "vqa",
  title: "Awaiting Remote-Sensing Analysis",
  metrics: [],
  confidence: 0,
  activeLayers: ["vegetation", "water"],
  meanNdvi: undefined,
  ndwi: undefined,
  ndbi: undefined,
  sarBackscatterDb: undefined,
};

export const useSatQuery = (opts?: {
  onQuerySuccess?: (queryText: string, location?: LocationMetadata, analysis?: AnalysisResult) => void;
}) => {
  const onQuerySuccess = opts?.onQuerySuccess;

  const [input, setInput] = useState("");
  const [location, setLocation] = useState<LocationMetadata>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [analysis, setAnalysis] = useState<AnalysisResult>(DEFAULT_ANALYSIS);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [answer, setAnswer] = useState(
    "Submit a question or upload remote-sensing imagery to begin analysis."
  );
  const [detailedReport, setDetailedReport] = useState<AgentDetailedReport | undefined>(undefined);
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
        setDetailedReport(response.detailedReport);

        setRecentQueries((items) => [
          response.recentQuery,
          ...items.filter((item) => item.text !== response.recentQuery.text),
        ].slice(0, 6));

        // Notify App.tsx that a query succeeded — used to trigger auto-analysis
        onQuerySuccess?.(trimmed, response.location, response.analysis);
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
        setDetailedReport(response.detailedReport);
        return response.location;
      } catch (err) {
        console.error("Failed to select region:", err);
        return null;
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

  return {
    input,
    setInput,
    location,
    setLocation,
    weather,
    analysis,
    setAnalysis,
    features,
    highlights,
    answer,
    setAnswer,
    detailedReport,
    setDetailedReport,
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
