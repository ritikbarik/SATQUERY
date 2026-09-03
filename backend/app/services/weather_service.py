import datetime
import httpx
from app.models.schemas import WeatherData

# Weather Code Mapping (WMO standard)
WMO_WEATHER_CODES: dict[int, str] = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Slight Rain Showers",
    81: "Moderate Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
}

WEATHER_CACHE: dict[str, tuple[WeatherData, datetime.datetime]] = {}
CACHE_DURATION_MINUTES = 15


async def get_live_weather(lat: float, lng: float, location_name: str = "") -> WeatherData:
    cache_key = f"{round(lat, 2)}:{round(lng, 2)}"
    now = datetime.datetime.now(datetime.timezone.utc)

    # Check cache validity
    if cache_key in WEATHER_CACHE:
        cached_data, cached_time = WEATHER_CACHE[cache_key]
        if (now - cached_time).total_seconds() < CACHE_DURATION_MINUTES * 60:
            return cached_data

    # Open-Meteo URL
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,uv_index,soil_moisture_0_to_7cm"
        f"&timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                w_code = current.get("weather_code", 1)
                condition = WMO_WEATHER_CODES.get(w_code, "Partly Cloudy")
                temp = float(current.get("temperature_2m", 28.0))
                humidity = int(current.get("relative_humidity_2m", 65))
                wind_speed = float(current.get("wind_speed_10m", 12.0))
                cloud_cover = int(current.get("cloud_cover", 20))
                soil_moisture = float(current.get("soil_moisture_0_to_7cm", 0.28)) * 100
                uv_index = float(current.get("uv_index", 5.5))
                precip = float(current.get("precipitation", 0.0))

                updated_str = datetime.datetime.now().strftime("%I:%M %p IST")

                weather = WeatherData(
                    temperature=round(temp, 1),
                    condition=condition,
                    humidity=humidity,
                    wind=f"{round(wind_speed, 1)} km/h",
                    cloudCover=cloud_cover,
                    soilMoisture=round(soil_moisture, 1),
                    uvIndex=round(uv_index, 1),
                    precipitationMm=round(precip, 1),
                    updatedAt=updated_str,
                    isLive=True,
                )
                WEATHER_CACHE[cache_key] = (weather, now)
                return weather
    except Exception:
        pass

    # High-quality dynamic fallback based on latitude & seasonal baseline
    base_temp = 32.0 - (lat - 10) * 0.4
    fallback_weather = WeatherData(
        temperature=round(base_temp, 1),
        condition="Partly Cloudy",
        humidity=62,
        wind="14 km/h",
        cloudCover=18,
        soilMoisture=24.5,
        uvIndex=6.2,
        precipitationMm=0.0,
        updatedAt=datetime.datetime.now().strftime("%I:%M %p IST"),
        isLive=False,
    )
    WEATHER_CACHE[cache_key] = (fallback_weather, now)
    return fallback_weather
