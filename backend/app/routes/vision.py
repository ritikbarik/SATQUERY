from fastapi import APIRouter
from app.models.schemas import SnapshotDiscussionRequest, SnapshotDiscussionResponse
from app.services.vision_discussion_service import vision_discussion_service
from app.services.ollama_service import get_model_status

router = APIRouter(prefix="/api/snapshot", tags=["snapshot-vision"])


@router.post("/discuss", response_model=SnapshotDiscussionResponse)
async def discuss_snapshot(request: SnapshotDiscussionRequest) -> SnapshotDiscussionResponse:
    """
    Capture a satellite map screenshot, pass it to Qwen3-VL for visual analysis,
    then synthesize with Qwen3 reasoner combining spectral indices + Open-Meteo weather.
    Falls back gracefully when Ollama is not installed.
    """
    return await vision_discussion_service.discuss_snapshot(request)


@router.post("/ask", response_model=SnapshotDiscussionResponse)
async def ask_snapshot_followup(request: SnapshotDiscussionRequest) -> SnapshotDiscussionResponse:
    """
    Answer follow-up questions grounded in the captured satellite snapshot via Qwen3-VL.
    """
    return await vision_discussion_service.discuss_snapshot(request)


from pydantic import BaseModel, Field
from app.services.satellite_capture_service import satellite_capture_service

class CapturePlaceRequest(BaseModel):
    place: str = Field(min_length=2, max_length=200)

class CaptureBoundsRequest(BaseModel):
    bbox: list[float] = Field(min_length=4, max_length=4)  # [south, north, west, east]
    displayName: str = "Satellite Scene"
    lat: float = 20.5937
    lng: float = 78.9629
    custom_zoom: int | None = None
    width: int = 800
    height: int = 600

@router.post("/capture-place")
async def capture_satellite_place(request: CapturePlaceRequest) -> dict:
    """
    Search any place in India / globally, fetch its high-resolution satellite scene
    from ArcGIS World Imagery / ISRO Bhuvan, and return base64 image data URL.
    """
    res = await satellite_capture_service.capture_place(request.place)
    res.pop("raw_bytes", None)
    return res


@router.post("/capture-bounds")
async def capture_satellite_bounds(request: CaptureBoundsRequest) -> dict:
    """
    Capture high-resolution satellite image for specific geographic bounding box.
    """
    res = await satellite_capture_service.capture_bounds(
        bbox=request.bbox,
        displayName=request.displayName,
        lat=request.lat,
        lng=request.lng,
        custom_zoom=request.custom_zoom,
        width=request.width,
        height=request.height,
    )
    res.pop("raw_bytes", None)
    return res


@router.get("/status")
async def model_status() -> dict:
    """Check Ollama availability and which models are loaded."""
    return await get_model_status()
