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


class AnalysisStats(BaseModel):
    waterBodies: int
    vegetationCover: float
    builtUpArea: float
    vegetationChange: float
    confidence: int = Field(ge=0, le=100)
    meanNdvi: float | None = 0.58
    ndwi: float | None = 0.22
    ndbi: float | None = 0.14
    sarBackscatterDb: float | None = -12.5
    opticalSarConfidence: float | None = 91.0
    evidence: list[str] = Field(default_factory=list)
    aiWorkflow: str | None = "multispectral_vqa"
    soilMoisture: float | None = 28.5


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


class QueryResponse(BaseModel):
    answer: str
    analysis: AnalysisStats
    location: LocationMetadata
    weather: WeatherData
    layers: LayerCollections
    highlights: list[str]
    recentQueries: list[RecentQuery]
    bigearthnet: BigEarthNetPatchDetail | None = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
