import type { LatLngExpression } from "leaflet";

export type QueryIntent =
  | "vegetation-loss"
  | "water-bodies"
  | "construction-growth"
  | "ndvi"
  | "roads"
  | "built-up"
  | "weather"
  | "vqa"
  | "captioning";

export interface AnalysisMetric {
  label: string;
  value: string;
  tone: "water" | "vegetation" | "built" | "decrease" | "increase";
}

export interface AnalysisResult {
  intent: QueryIntent;
  title: string;
  metrics: AnalysisMetric[];
  confidence: number;
  activeLayers: Array<"vegetation" | "water" | "built" | "decrease" | "increase">;
  meanNdvi?: number;
  ndwi?: number;
  ndbi?: number;
  sarBackscatterDb?: number;
  opticalSarConfidence?: number;
  evidence?: string[];
  aiWorkflow?: string;
  soilMoisture?: number;
}

export interface GeoFeature {
  id: string;
  name: string;
  type: "vegetation" | "water" | "built" | "decrease" | "increase" | "boundary";
  coordinates: LatLngExpression[];
  areaKm2?: number;
  confidence?: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  wind: string;
  cloudCover: number;
  soilMoisture: number;
  uvIndex: number;
  precipitationMm: number;
  updatedAt: string;
  isLive: boolean;
}

export interface LocationMetadata {
  displayName: string;
  regionName: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  boundingBox: number[];
  areaKm2: number;
  elevationMeters: number;
  coordinatesDisplay: string;
}

export interface AreaInformation {
  location: string;
  area: string;
  coordinates: string;
  vegetationCover: string;
  waterBodies: string;
  builtUpArea: string;
  elevation: string;
  soilMoisture?: string;
  ndbi?: string;
}

export interface RecentQuery {
  id: string;
  text: string;
  timestamp: string;
  intent: QueryIntent;
  location?: string;
}

export interface QueryRequest {
  question: string;
  location: string;
}

export interface BigEarthNetVQAPair {
  id?: number;
  question: string;
  answer: string;
  category?: string;
  type?: string;
}

export interface BigEarthNetPatchSummary {
  patch_id: string;
  s1_name?: string;
  country: string;
  latitude: number;
  longitude: number;
  season?: string;
  climate_zone?: string;
  sample_question?: string;
  sample_answer?: string;
}

export interface BigEarthNetPatchDetail {
  patch_id: string;
  s1_name?: string;
  country: string;
  latitude: number;
  longitude: number;
  season?: string;
  climate_zone?: string;
  overview_caption?: string;
  qa_pairs: BigEarthNetVQAPair[];
  geojson_features: GeoJsonFeature[];
}

export interface BigEarthNetStats {
  total_records: number;
  unique_patches: number;
  countries: Array<{ country: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
  status: string;
}

export interface QueryResponse {
  analysis: AnalysisResult;
  features: GeoFeature[];
  location: LocationMetadata;
  weather: WeatherData;
  highlights: string[];
  recentQuery: RecentQuery;
  assistantMessage: string;
  bigearthnet?: BigEarthNetPatchDetail;
}

export interface BackendQueryIntent {
  task: "change_detection" | "proximity" | "index" | "detection" | "weather" | "vqa" | "captioning" | "unsupported";
  target: "vegetation" | "water" | "built_up" | "roads" | "weather" | "sar_fusion" | "unsupported";
  startDate: string | null;
  endDate: string | null;
  location: string;
  detectedLocation?: string | null;
  highlights?: string[];
}

export interface BackendAnalysisStats {
  waterBodies: number;
  vegetationCover: number;
  builtUpArea: number;
  vegetationChange: number;
  confidence: number;
  meanNdvi?: number;
  ndwi?: number;
  ndbi?: number;
  sarBackscatterDb?: number;
  opticalSarConfidence?: number;
  evidence?: string[];
  aiWorkflow?: string;
  soilMoisture?: number;
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    class: string;
    confidence: number;
    area_km2: number;
    name: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface BackendLayerCollections {
  vegetation: GeoJsonFeatureCollection;
  water: GeoJsonFeatureCollection;
  builtUp: GeoJsonFeatureCollection;
  decrease: GeoJsonFeatureCollection;
  increase: GeoJsonFeatureCollection;
  boundary: GeoJsonFeatureCollection;
}

export interface BackendRecentQuery {
  id: string;
  text: string;
  timestamp: string;
  intent: BackendQueryIntent;
}

export interface BackendQueryResponse {
  answer: string;
  analysis: BackendAnalysisStats;
  location: LocationMetadata;
  weather: WeatherData;
  layers: BackendLayerCollections;
  highlights: string[];
  recentQueries: BackendRecentQuery[];
  bigearthnet?: BigEarthNetPatchDetail;
}
