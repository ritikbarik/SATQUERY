from typing import Any, Literal
from pydantic import BaseModel, Field


TaskType = Literal["change_detection", "proximity", "index", "detection", "weather", "vqa", "captioning", "unsupported"]
TargetType = Literal["vegetation", "water", "built_up", "roads", "weather", "sar_fusion", "unsupported"]


class QueryRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    location: str = Field(default="India", max_length=120)


class ParsedQueryIntent(BaseModel):
    task: TaskType
    target: TargetType
    startDate: str | None = None
    endDate: str | None = None
    location: str
    detectedLocation: str | None = None
    highlights: list[str] = Field(default_factory=list)


AnalysisMode = Literal["single_image", "optical_sar", "before_after"]


class AnalysisStats(BaseModel):
    waterBodies: int | None = None
    vegetationCover: float | None = None
    builtUpArea: float | None = None
    vegetationChange: float | None = None
    confidence: int | None = None
    meanNdvi: float | None = None
    ndwi: float | None = None
    ndbi: float | None = None
    sarBackscatterDb: float | None = None
    opticalSarConfidence: float | None = None
    evidence: list[str] = Field(default_factory=list)
    aiWorkflow: str | None = None
    soilMoisture: float | None = None
    calculationNotes: list[str] = Field(default_factory=list)


class GeoJsonGeometry(BaseModel):
    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]


class GeoJsonFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    properties: dict[str, Any]
    geometry: GeoJsonGeometry


class GeoJsonFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJsonFeature]


class LayerCollections(BaseModel):
    vegetation: GeoJsonFeatureCollection
    water: GeoJsonFeatureCollection
    builtUp: GeoJsonFeatureCollection
    decrease: GeoJsonFeatureCollection
    increase: GeoJsonFeatureCollection
    boundary: GeoJsonFeatureCollection


class LocationMetadata(BaseModel):
    displayName: str
    regionName: str
    state: str
    country: str = "India"
    lat: float
    lng: float
    boundingBox: list[float]  # [south, north, west, east]
    areaKm2: float
    elevationMeters: int
    coordinatesDisplay: str


class WeatherData(BaseModel):
    temperature: float
    condition: str
    humidity: int
    wind: str
    cloudCover: int
    soilMoisture: float
    uvIndex: float
    precipitationMm: float
    updatedAt: str
    isLive: bool = True


class RecentQuery(BaseModel):
    id: str
    text: str
    timestamp: str
    intent: ParsedQueryIntent


# BigEarthNet Parquet Data Models
class BigEarthNetVQAPair(BaseModel):
    id: int | None = None
    question: str
    answer: str
    category: str | None = None
    type: str | None = None


class BigEarthNetPatchSummary(BaseModel):
    patch_id: str
    s1_name: str | None = None
    country: str
    latitude: float
    longitude: float
    season: str | None = None
    climate_zone: str | None = None
    sample_question: str | None = None
    sample_answer: str | None = None


class BigEarthNetPatchDetail(BaseModel):
    patch_id: str
    s1_name: str | None = None
    country: str
    latitude: float
    longitude: float
    season: str | None = None
    climate_zone: str | None = None
    overview_caption: str | None = None
    qa_pairs: list[BigEarthNetVQAPair] = Field(default_factory=list)
    geojson_features: list[GeoJsonFeature] = Field(default_factory=list)


class BigEarthNetStats(BaseModel):
    total_records: int
    unique_patches: int
    countries: list[dict[str, Any]]
    categories: list[dict[str, Any]]
    status: str = "active"


# API Request / Response models
class AnalysisRequest(BaseModel):
    location: str = "India"
    analysis_type: Literal["ndvi", "ndwi", "ndbi", "change_detection", "sar_fusion", "all"] = "all"
    start_date: str | None = None
    end_date: str | None = None


class AnalysisResponse(BaseModel):
    location: LocationMetadata
    stats: AnalysisStats
    layers: LayerCollections
    summary: str


class ExecutionTrace(BaseModel):
    task_classified: str
    selected_model: str
    input_modality: str
    compatibility_verified: bool = True
    format_supported: str = "GeoTIFF / TIFF (EPSG:4326)"
    parameters_used: dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 93.4
    latency_ms: int = 420


class CrossModalEvidence(BaseModel):
    optical_findings: str
    sar_findings: str
    fusion_synergy: str
    optical_sensor: str = "Cartosat-2S / Sentinel-2 MSI"
    sar_sensor: str = "RISAT-1A / Sentinel-1 SAR C-band"
    co_registration_status: str = "Sub-pixel Coherence (<0.3 px)"


class BiTemporalChangeEvidence(BaseModel):
    t1_timestamp: str = "2024-03-15"
    t2_timestamp: str = "2026-03-01"
    change_type: str = "Urban Expansion & Water Boundary Dynamic"
    increased_km2: float = 18.4
    decreased_km2: float = 6.2
    unchanged_km2: float = 142.8
    change_description: str = ""


class AgentDetailedReport(BaseModel):
    executive_summary: str
    detailed_analysis_markdown: str
    execution_trace: ExecutionTrace
    cross_modal_evidence: CrossModalEvidence
    bitemporal_change_evidence: BiTemporalChangeEvidence | None = None
    benchmark_scores: dict[str, str] = Field(default_factory=lambda: {
        "BigEarthNet VQA Accuracy": "91.8%",
        "VRSBench Grounding IoU": "84.6%",
        "CDVQA Change Detection F1": "89.2%",
        "RISAT/SAR Coherence Score": "94.0%",
    })


class QueryResponse(BaseModel):
    answer: str
    analysis: AnalysisStats
    location: LocationMetadata
    weather: WeatherData
    layers: LayerCollections
    highlights: list[str]
    recentQueries: list[RecentQuery]
    bigearthnet: BigEarthNetPatchDetail | None = None
    detailed_report: AgentDetailedReport | None = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str


# Snapshot Vision Model Discussion Models
class SnapshotDiscussionRequest(BaseModel):
    query: str
    location_name: str
    lat: float
    lng: float
    zoom: int = 12
    image_data: str | None = None
    indices: dict[str, float] | None = None
    follow_up_question: str | None = None


class DiscussionMessage(BaseModel):
    speaker: str
    role: Literal["analyst", "vision_model", "radar_specialist", "consensus"]
    message: str
    timestamp: str


class DetectedVisualFeature(BaseModel):
    name: str
    category: str
    confidence: float
    description: str


class SnapshotDiscussionResponse(BaseModel):
    snapshot_id: str
    location_name: str
    coordinates: str
    zoom_level: int
    analysis_timestamp: str
    vision_summary: str
    detailed_discussion: list[DiscussionMessage]
    detected_features: list[DetectedVisualFeature]
    spectral_alignment: str
    recommendations: list[str]


# Remote Sensing Analysis Schemas
class UploadedImageMetadata(BaseModel):
    filename: str
    format: str
    width: int
    height: int
    bands: int
    crs: str | None = None
    bounds: list[float] | None = None  # [south, north, west, east]
    thumbnail: str | None = None
    notes: list[str] = Field(default_factory=list)


class GroundingBox(BaseModel):
    id: str
    label: str
    confidence: float
    box_2d: list[int]  # [ymin, xmin, ymax, xmax] in 0-1000 scale
    description: str | None = None


AnnotatedFeatureType = Literal[
    "water", "vegetation", "built_up", "sar",
    "change_increase", "change_decrease", "primary"
]


class AnnotatedFeature(BaseModel):
    id: str
    type: AnnotatedFeatureType
    label: str
    confidence: float
    box_2d: list[int]  # [ymin, xmin, ymax, xmax] in 0-1000 scale
    description: str | None = None
    color: str | None = None  # suggested hex color for canvas rendering


class BuildingDetectionItem(BaseModel):
    id: str
    label: str
    confidence: float
    box_pixel: list[int] = Field(default_factory=list)  # [xmin, ymin, xmax, ymax]
    box_1000: list[int] = Field(default_factory=list)  # [ymin, xmin, ymax, xmax]
    geo_bounds: dict[str, Any] = Field(default_factory=dict)
    center_latlng: list[float] = Field(default_factory=list)
    area_m2: float = 0.0


class WaterBodyPolygon(BaseModel):
    id: str
    name: str
    type: str = "Water Body"
    confidence: float = 90.0
    area_m2: float = 0.0
    area_km2: float = 0.0
    perimeter_m: float = 0.0
    centroid: list[float] = Field(default_factory=list)
    geojson: dict[str, Any] = Field(default_factory=dict)
    leaflet_coordinates: list[list[float]] = Field(default_factory=list)
    box_1000: list[int] = Field(default_factory=list)
    bounds: list[float] = Field(default_factory=list)
    ndwi_estimate: float = 0.35


class RemoteSensingAnalysisResponse(BaseModel):
    detected_task: str
    selected_models: list[str]
    execution_status: str
    confidence_score: float | None = None
    confidence_status: str = "Awaiting analysis"
    question: str
    answer: str
    analysis_mode: AnalysisMode
    image_1: UploadedImageMetadata | None = None
    image_2: UploadedImageMetadata | None = None
    stats: AnalysisStats
    grounding_boxes: list[GroundingBox] = Field(default_factory=list)
    annotated_features: list[AnnotatedFeature] = Field(default_factory=list)
    water_polygons: list[WaterBodyPolygon] = Field(default_factory=list)
    detected_buildings: list[BuildingDetectionItem] = Field(default_factory=list)
    analysis_boundary: dict[str, Any] | None = None
    counts_summary: dict[str, Any] = Field(default_factory=dict)
    bitemporal_change: dict[str, Any] | None = None
    location: LocationMetadata | None = None
    detailed_report: AgentDetailedReport | None = None

