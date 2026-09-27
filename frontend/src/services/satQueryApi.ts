import type {
  AgentDetailedReport,
  AnalysisMetric,
  BackendLayerCollections,
  BackendQueryIntent,
  BackendQueryResponse,
  BigEarthNetPatchDetail,
  BigEarthNetPatchSummary,
  BigEarthNetStats,
  GeoFeature,
  GeoJsonFeatureCollection,
  LocationMetadata,
  QueryIntent,
  QueryRequest,
  QueryResponse,
  RecentQuery,
  RemoteSensingAnalysisResult,
  SnapshotDiscussionResponse,
  WeatherData,
} from "../types/satquery";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://satquery-backend-9uys.onrender.com" : "");

export class SatQueryApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SatQueryApiError";
  }
}

export const submitSatQuery = async (request: QueryRequest): Promise<QueryResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new SatQueryApiError(`SatQuery API returned ${response.status}`);
  }

  const backendResponse = (await response.json()) as BackendQueryResponse;
  return adaptBackendResponse(backendResponse);
};

export const fetchLocationData = async (query: string): Promise<LocationMetadata> => {
  const response = await fetch(`${API_BASE_URL}/api/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch location`);
  }
  return response.json();
};

export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  const response = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lng=${lng}`);
  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch weather`);
  }
  return response.json();
};

export const requestSnapshotDiscussion = async (params: {
  query: string;
  location_name: string;
  lat: number;
  lng: number;
  zoom?: number;
  image_data?: string;
  indices?: Record<string, number>;
  follow_up_question?: string;
}): Promise<SnapshotDiscussionResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/snapshot/discuss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch snapshot discussion: ${response.status}`);
  }

  return response.json();
};

export const askSnapshotFollowup = async (params: {
  query: string;
  location_name: string;
  lat: number;
  lng: number;
  zoom?: number;
  image_data?: string;
  indices?: Record<string, number>;
  follow_up_question: string;
}): Promise<SnapshotDiscussionResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/snapshot/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new SatQueryApiError(`Failed to submit snapshot follow-up: ${response.status}`);
  }

  return response.json();
};

export const fetchBigEarthNetStats = async (): Promise<BigEarthNetStats> => {
  const response = await fetch(`${API_BASE_URL}/api/bigearthnet/stats`);
  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch BigEarthNet stats`);
  }
  return response.json();
};

export const fetchBigEarthNetPatches = async (country?: string): Promise<BigEarthNetPatchSummary[]> => {
  const url = country
    ? `${API_BASE_URL}/api/bigearthnet/patches?country=${encodeURIComponent(country)}`
    : `${API_BASE_URL}/api/bigearthnet/patches`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch BigEarthNet patches`);
  }
  return response.json();
};

export const fetchBigEarthNetPatchDetail = async (patchId: string): Promise<BigEarthNetPatchDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/bigearthnet/patch/${encodeURIComponent(patchId)}`);
  if (!response.ok) {
    throw new SatQueryApiError(`Failed to fetch BigEarthNet patch detail`);
  }
  return response.json();
};

const adaptBackendResponse = (response: BackendQueryResponse): QueryResponse => {
  const intent = toFrontendIntent(response.recentQueries[0]?.intent);
  const metrics: AnalysisMetric[] = [
    { label: "Water Bodies", value: `${response.analysis.waterBodies} detected`, tone: "water" },
    { label: "Vegetation Cover", value: `${response.analysis.vegetationCover}%`, tone: "vegetation" },
    { label: "Built-up Area", value: `${response.analysis.builtUpArea}%`, tone: "built" },
    {
      label: "Vegetation Change",
      value: `${response.analysis.vegetationChange > 0 ? "+" : ""}${response.analysis.vegetationChange}%`,
      tone: response.analysis.vegetationChange < 0 ? "decrease" : "increase",
    },
  ];

  return {
    analysis: {
      intent,
      title: titleFromIntent(intent, response.location?.regionName),
      metrics,
      confidence: response.analysis.confidence,
      activeLayers: activeLayersFromBackend(response.layers),
      meanNdvi: response.analysis.meanNdvi,
      ndwi: response.analysis.ndwi,
      ndbi: response.analysis.ndbi,
      sarBackscatterDb: response.analysis.sarBackscatterDb,
      opticalSarConfidence: response.analysis.opticalSarConfidence,
      evidence: response.analysis.evidence,
      aiWorkflow: response.analysis.aiWorkflow,
      soilMoisture: response.analysis.soilMoisture,
      vegetationCover: response.analysis.vegetationCover,
      waterBodies: response.analysis.waterBodies,
      builtUpArea: response.analysis.builtUpArea,
    },
    features: flattenLayers(response.layers),
    location: response.location,
    weather: response.weather,
    highlights: response.highlights || [],
    recentQuery: toRecentQuery(response.recentQueries[0], intent, response.location?.displayName),
    assistantMessage: response.answer,
    bigearthnet: response.bigearthnet,
    detailedReport: response.detailed_report as AgentDetailedReport | undefined,
  };
};

const toFrontendIntent = (intent?: BackendQueryIntent): QueryIntent => {
  if (!intent) return "vegetation-loss";
  if (intent.task === "weather") return "weather";
  if (intent.task === "proximity" && intent.target === "water") return "water-bodies";
  if (intent.task === "change_detection" && intent.target === "built_up") return "construction-growth";
  if (intent.task === "index" && intent.target === "vegetation") return "ndvi";
  if (intent.task === "detection" && intent.target === "built_up") return "built-up";
  if (intent.task === "vqa") return "vqa";
  if (intent.task === "captioning") return "captioning";
  if (intent.target === "roads") return "roads";
  return "vegetation-loss";
};

const titleFromIntent = (intent: QueryIntent, regionName?: string) => {
  const reg = regionName ? ` - ${regionName}` : "";
  const titles: Record<QueryIntent, string> = {
    "vegetation-loss": `Vegetation Change Analysis${reg}`,
    "water-bodies": `Hydrological & Water Extraction${reg}`,
    "construction-growth": `Built-Up Expansion Scan${reg}`,
    ndvi: `NDVI Multispectral Analysis${reg}`,
    roads: `Road Corridor Detection${reg}`,
    "built-up": `Settlement & Infrastructure Scan${reg}`,
    weather: `Meteorological & Soil Index${reg}`,
    vqa: `BigEarthNet Visual QA Intelligence${reg}`,
    captioning: `Satellite Scene Landscape Captioning${reg}`,
  };
  return titles[intent] || `Satellite Intelligence Analysis${reg}`;
};

const activeLayersFromBackend = (layers: BackendLayerCollections) => {
  const active: Array<"vegetation" | "water" | "built" | "decrease" | "increase"> = [];
  if (layers.vegetation?.features?.length) active.push("vegetation");
  if (layers.water?.features?.length) active.push("water");
  if (layers.builtUp?.features?.length) active.push("built");
  if (layers.decrease?.features?.length) active.push("decrease");
  if (layers.increase?.features?.length) active.push("increase");
  return active;
};

const flattenLayers = (layers: BackendLayerCollections): GeoFeature[] => [
  ...fromCollection(layers.boundary, "boundary"),
  ...fromCollection(layers.vegetation, "vegetation"),
  ...fromCollection(layers.water, "water"),
  ...fromCollection(layers.builtUp, "built"),
  ...fromCollection(layers.decrease, "decrease"),
  ...fromCollection(layers.increase, "increase"),
];

const fromCollection = (
  collection: GeoJsonFeatureCollection | undefined,
  type: GeoFeature["type"],
): GeoFeature[] => {
  if (!collection || !collection.features) return [];
  return collection.features.map((feature, index) => ({
    id: `${type}-${index}-${feature.properties?.name ?? "feature"}`,
    name: feature.properties?.name ?? "Satellite Feature",
    type,
    areaKm2: feature.properties?.area_km2,
    confidence: feature.properties?.confidence,
    coordinates: feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]),
  }));
};

const toRecentQuery = (
  recentQuery: BackendQueryResponse["recentQueries"][number] | undefined,
  intent: QueryIntent,
  location?: string,
): RecentQuery => ({
  id: recentQuery?.id ?? crypto.randomUUID(),
  text: recentQuery?.text ?? "Satellite Intelligence Query",
  timestamp: recentQuery?.timestamp ?? "Just now",
  intent,
  location,
});

export interface RemoteSensingSubmitParams {
  question: string;
  analysis_mode: string;
  location: string;
  image_1?: File | null;
  image_2?: File | null;
}

export const submitRemoteSensingAnalysis = async (
  params: RemoteSensingSubmitParams
): Promise<RemoteSensingAnalysisResult> => {
  const formData = new FormData();
  formData.append("question", params.question);
  formData.append("analysis_mode", params.analysis_mode);
  formData.append("location", params.location);
  if (params.image_1) {
    formData.append("image_1", params.image_1);
  }
  if (params.image_2) {
    formData.append("image_2", params.image_2);
  }

  const response = await fetch(`${API_BASE_URL}/api/rs/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new SatQueryApiError(`Remote Sensing Analysis failed with HTTP ${response.status}`);
  }

  return response.json();
};

