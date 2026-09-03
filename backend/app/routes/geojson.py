from fastapi import APIRouter
from app.models.schemas import LayerCollections
from app.services.geocoding_service import resolve_location
from app.services.geojson_service import build_dynamic_layers

router = APIRouter(prefix="/api", tags=["geojson"])


@router.get("/geojson", response_model=LayerCollections)
async def get_geojson_layers(location: str = "India", layers: str = "vegetation,water,builtUp") -> LayerCollections:
    loc = await resolve_location(location)
    active_layers = [l.strip() for l in layers.split(",") if l.strip()]
    return build_dynamic_layers(loc, active_layers)
