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
  calculationNotes?: string[];
  vegetationCover?: number;
  waterBodies?: number;
  builtUpArea?: number;
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
  detailedReport?: AgentDetailedReport;
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
  calculationNotes?: string[];
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

export interface ExecutionTrace {
  task_classified: string;
  selected_model: string;
  input_modality: string;
  compatibility_verified: boolean;
  format_supported: string;
  parameters_used: Record<string, unknown>;
  confidence_score: number;
  latency_ms: number;
}

export interface CrossModalEvidence {
  optical_findings: string;
  sar_findings: string;
  fusion_synergy: string;
  optical_sensor: string;
  sar_sensor: string;
  co_registration_status: string;
}

export interface BiTemporalChangeEvidence {
  t1_timestamp: string;
  t2_timestamp: string;
  change_type: string;
  increased_km2: number;
  decreased_km2: number;
  unchanged_km2: number;
  change_description: string;
}

export interface AgentDetailedReport {
  executive_summary: string;
  detailed_analysis_markdown: string;
  execution_trace: ExecutionTrace;
  cross_modal_evidence: CrossModalEvidence;
  bitemporal_change_evidence?: BiTemporalChangeEvidence;
  benchmark_scores: Record<string, string>;
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
  detailed_report?: AgentDetailedReport;
}

export interface DiscussionMessage {
  speaker: string;
  role: "analyst" | "vision_model" | "radar_specialist" | "consensus";
  message: string;
  timestamp: string;
}

export interface DetectedVisualFeature {
  name: string;
  category: string;
  confidence: number;
  description: string;
}

export interface SnapshotDiscussionResponse {
  snapshot_id: string;
  location_name: string;
  coordinates: string;
  zoom_level: number;
  analysis_timestamp: string;
  vision_summary: string;
  detailed_discussion: DiscussionMessage[];
  detected_features: DetectedVisualFeature[];
  spectral_alignment: string;
  recommendations: string[];
}

export type AnalysisMode = "single_image" | "optical_sar" | "before_after";

export interface UploadedImageInfo {
  file: File;
  previewUrl: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  bands?: number;
  crs?: string | null;
  bounds?: [number, number, number, number] | null;
  thumbnail?: string | null;
  source?: string;
  notes?: string[];
}

export interface GroundingBoxItem {
  id: string;
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  description?: string;
}

export type AnnotatedFeatureType =
  | "water"
  | "vegetation"
  | "built_up"
  | "sar"
  | "change_increase"
  | "change_decrease"
  | "primary";

export interface AnnotatedFeature {
  id: string;
  type: AnnotatedFeatureType;
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  description?: string;
  color?: string; // hex hint from backend
}

export interface BuildingDetectionItem {
  id: string;
  label: string;
  confidence: number;
  box_pixel?: [number, number, number, number];
  box_1000?: [number, number, number, number];
  geo_bounds?: {
    south: number;
    north: number;
    west: number;
    east: number;
    center: [number, number];
    leaflet_bounds: [[number, number], [number, number]];
  };
  center_latlng?: [number, number];
  area_m2?: number;
}

export interface WaterBodyPolygon {
  id: string;
  name: string;
  type: string;
  confidence: number;
  area_m2: number;
  area_km2: number;
  perimeter_m?: number;
  centroid?: [number, number];
  geojson?: any;
  leaflet_coordinates: [number, number][];
  box_1000?: [number, number, number, number];
  bounds?: [number, number, number, number];
  ndwi_estimate?: number;
}

export interface GeographicAnalysisBoundary {
  type: string;
  coordinates?: any;
  leaflet_bounds?: [[number, number], [number, number]];
  center?: [number, number];
  zoom?: number;
  category?: string;
  delta_deg?: number;
  bounds?: [number, number, number, number];
}

export interface RemoteSensingAnalysisResult {
  detected_task: string;
  selected_models: string[];
  execution_status: string;
  confidence_score?: number | null;
  confidence_status: string;
  question: string;
  answer: string;
  analysis_mode: AnalysisMode;
  image_1?: UploadedImageInfo | null;
  image_2?: UploadedImageInfo | null;
  stats?: Partial<AnalysisResult>;
  grounding_boxes: GroundingBoxItem[];
  annotated_features?: AnnotatedFeature[];
  water_polygons?: WaterBodyPolygon[];
  detected_buildings?: BuildingDetectionItem[];
  analysis_boundary?: GeographicAnalysisBoundary | null;
  counts_summary?: {
    buildings?: number;
    water_bodies?: number;
    total_water_area_m2?: number;
    total_water_area_km2?: number;
  };
  bitemporal_change?: {
    increased_pct?: number;
    decreased_pct?: number;
    unchanged_pct?: number;
    description?: string;
    change_mask_b64?: string;
  } | null;
  location?: LocationMetadata;
  detailed_report?: AgentDetailedReport;
}


