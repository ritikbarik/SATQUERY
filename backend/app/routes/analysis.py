from fastapi import APIRouter
from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.services.geocoding_service import resolve_location
from app.services.geojson_service import build_dynamic_layers
from app.services.satellite_service import satellite_service

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analysis", response_model=AnalysisResponse)
async def run_geospatial_analysis(request: AnalysisRequest) -> AnalysisResponse:
    loc = await resolve_location(request.location)
    stats = satellite_service.analyze_spectral_profile(
        loc=loc,
        target=request.analysis_type,
        start_year=request.start_date,
        end_year=request.end_date,
    )
    layers = build_dynamic_layers(loc, ["vegetation", "water", "builtUp", "decrease", "increase"])
    summary = (
        f"Geospatial multispectral analysis for {loc.displayName}: "
        f"NDVI {stats.meanNdvi}, NDWI {stats.ndwi}, NDBI {stats.ndbi}, "
        f"Sentinel-1 SAR backscatter {stats.sarBackscatterDb} dB with {stats.confidence}% confidence."
    )
    return AnalysisResponse(
        location=loc,
        stats=stats,
        layers=layers,
        summary=summary,
    )
