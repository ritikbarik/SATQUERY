from fastapi import APIRouter
from app.models.schemas import LocationMetadata
from app.services.geocoding_service import resolve_location

router = APIRouter(prefix="/api", tags=["geocoding"])


@router.get("/geocode", response_model=LocationMetadata)
@router.get("/location", response_model=LocationMetadata)
async def lookup_location(q: str = "India") -> LocationMetadata:
    return await resolve_location(q)
