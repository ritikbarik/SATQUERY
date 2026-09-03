from fastapi import APIRouter
from app.models.schemas import WeatherData
from app.services.weather_service import get_live_weather

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherData)
async def fetch_weather(lat: float = 20.2961, lng: float = 85.8245, location_name: str = "") -> WeatherData:
    return await get_live_weather(lat, lng, location_name)
