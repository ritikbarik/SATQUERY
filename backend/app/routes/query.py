from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter

from app.models.schemas import HealthResponse, LocationMetadata, QueryRequest, QueryResponse, RecentQuery, WeatherData
from app.services.analysis_engine import analyze
from app.services.geocoding_service import resolve_location
from app.services.query_parser import parse_query
from app.services.weather_service import get_live_weather

router = APIRouter(prefix="/api", tags=["query"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="SatQuery AI All-India Intelligence API")


@router.post("/query", response_model=QueryResponse)
async def query_satellite_intelligence(request: QueryRequest) -> QueryResponse:
    # 1. Parse query intent
    intent = parse_query(request)

    # 2. Resolve location (async)
    loc = await resolve_location(intent.location, request.question)

    # 3. Fetch live weather (concurrently with analysis)
    weather = await get_live_weather(loc.lat, loc.lng, loc.displayName)

    # 4. Perform dynamic geospatial multispectral analysis with Agent Controller & BigEarthNet VQA
    output = analyze(intent, loc, weather)

    # Merge parser highlights with analysis highlights
    all_highlights = list(set(intent.highlights + output.highlights))

    recent_query = RecentQuery(
        id=str(uuid4()),
        text=request.question,
        timestamp=datetime.now().strftime("%I:%M %p"),
        intent=intent,
    )

    return QueryResponse(
        answer=output.answer,
        analysis=output.analysis,
        location=loc,
        weather=weather,
        layers=output.layers,
        highlights=all_highlights,
        recentQueries=[recent_query],
        bigearthnet=output.bigearthnet,
    )
