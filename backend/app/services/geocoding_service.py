import asyncio
import re
from typing import Any
import httpx
from app.models.schemas import LocationMetadata

# Comprehensive Indian Regional Geo-Database (Instant offline fallback & fast resolution)
INDIA_REGIONS: dict[str, dict[str, Any]] = {
    "odisha": {
        "displayName": "Odisha, India",
        "regionName": "Odisha",
        "state": "Odisha",
        "lat": 20.2961,
        "lng": 85.8245,
        "bbox": [17.78, 22.57, 81.37, 87.53],
        "areaKm2": 155707.0,
        "elevationMeters": 158,
    },
    "bhubaneswar": {
        "displayName": "Bhubaneswar, Odisha, India",
        "regionName": "Bhubaneswar",
        "state": "Odisha",
        "lat": 20.2961,
        "lng": 85.8245,
        "bbox": [20.18, 20.40, 85.70, 85.95],
        "areaKm2": 422.0,
        "elevationMeters": 45,
    },
    "puri": {
        "displayName": "Puri, Odisha, India",
        "regionName": "Puri",
        "state": "Odisha",
        "lat": 19.8135,
        "lng": 85.8312,
        "bbox": [19.70, 19.95, 85.70, 85.95],
        "areaKm2": 3479.0,
        "elevationMeters": 10,
    },
    "chilika": {
        "displayName": "Chilika Lake, Odisha, India",
        "regionName": "Chilika Lake",
        "state": "Odisha",
        "lat": 19.7167,
        "lng": 85.3167,
        "bbox": [19.45, 19.95, 85.10, 85.60],
        "areaKm2": 1165.0,
        "elevationMeters": 2,
    },
    "cuttack": {
        "displayName": "Cuttack, Odisha, India",
        "regionName": "Cuttack",
        "state": "Odisha",
        "lat": 20.4625,
        "lng": 85.8828,
        "bbox": [20.35, 20.55, 85.75, 86.00],
        "areaKm2": 3932.0,
        "elevationMeters": 36,
    },
    "delhi": {
        "displayName": "Delhi NCR, India",
        "regionName": "Delhi",
        "state": "Delhi",
        "lat": 28.6139,
        "lng": 77.2090,
        "bbox": [28.40, 28.88, 76.84, 77.35],
        "areaKm2": 1484.0,
        "elevationMeters": 216,
    },
    "mumbai": {
        "displayName": "Mumbai, Maharashtra, India",
        "regionName": "Mumbai",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lng": 72.8777,
        "bbox": [18.89, 19.27, 72.77, 73.02],
        "areaKm2": 603.4,
        "elevationMeters": 14,
    },
    "bengaluru": {
        "displayName": "Bengaluru, Karnataka, India",
        "regionName": "Bengaluru",
        "state": "Karnataka",
        "lat": 12.9716,
        "lng": 77.5946,
        "bbox": [12.83, 13.14, 77.46, 77.78],
        "areaKm2": 741.0,
        "elevationMeters": 920,
    },
    "bangalore": {
        "displayName": "Bengaluru, Karnataka, India",
        "regionName": "Bengaluru",
        "state": "Karnataka",
        "lat": 12.9716,
        "lng": 77.5946,
        "bbox": [12.83, 13.14, 77.46, 77.78],
        "areaKm2": 741.0,
        "elevationMeters": 920,
    },
    "hyderabad": {
        "displayName": "Hyderabad, Telangana, India",
        "regionName": "Hyderabad",
        "state": "Telangana",
        "lat": 17.3850,
        "lng": 78.4867,
        "bbox": [17.25, 17.55, 78.30, 78.60],
        "areaKm2": 650.0,
        "elevationMeters": 542,
    },
    "chennai": {
        "displayName": "Chennai, Tamil Nadu, India",
        "regionName": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.0827,
        "lng": 80.2707,
        "bbox": [12.90, 13.25, 80.10, 80.35],
        "areaKm2": 426.0,
        "elevationMeters": 6,
    },
    "kolkata": {
        "displayName": "Kolkata, West Bengal, India",
        "regionName": "Kolkata",
        "state": "West Bengal",
        "lat": 22.5726,
        "lng": 88.3639,
        "bbox": [22.45, 22.70, 88.25, 88.48],
        "areaKm2": 206.1,
        "elevationMeters": 9,
    },
    "pune": {
        "displayName": "Pune, Maharashtra, India",
        "regionName": "Pune",
        "state": "Maharashtra",
        "lat": 18.5204,
        "lng": 73.8567,
        "bbox": [18.40, 18.65, 73.75, 74.00],
        "areaKm2": 331.3,
        "elevationMeters": 560,
    },
    "ahmedabad": {
        "displayName": "Ahmedabad, Gujarat, India",
        "regionName": "Ahmedabad",
        "state": "Gujarat",
        "lat": 23.0225,
        "lng": 72.5714,
        "bbox": [22.90, 23.15, 72.45, 72.70],
        "areaKm2": 505.0,
        "elevationMeters": 53,
    },
    "jaipur": {
        "displayName": "Jaipur, Rajasthan, India",
        "regionName": "Jaipur",
        "state": "Rajasthan",
        "lat": 26.9124,
        "lng": 75.7873,
        "bbox": [26.75, 27.05, 75.65, 75.95],
        "areaKm2": 467.0,
        "elevationMeters": 431,
    },
    "punjab": {
        "displayName": "Punjab, India",
        "regionName": "Punjab",
        "state": "Punjab",
        "lat": 31.1471,
        "lng": 75.3412,
        "bbox": [29.50, 32.50, 73.80, 76.90],
        "areaKm2": 50362.0,
        "elevationMeters": 240,
    },
    "kerala": {
        "displayName": "Kerala, India",
        "regionName": "Kerala",
        "state": "Kerala",
        "lat": 10.8505,
        "lng": 76.2711,
        "bbox": [8.18, 12.80, 74.85, 77.40],
        "areaKm2": 38863.0,
        "elevationMeters": 300,
    },
    "western ghats": {
        "displayName": "Western Ghats, India",
        "regionName": "Western Ghats",
        "state": "Karnataka / Maharashtra / Kerala",
        "lat": 13.5000,
        "lng": 75.5000,
        "bbox": [8.00, 21.00, 73.00, 77.00],
        "areaKm2": 160000.0,
        "elevationMeters": 1200,
    },
    "sundarbans": {
        "displayName": "Sundarbans Delta, West Bengal, India",
        "regionName": "Sundarbans",
        "state": "West Bengal",
        "lat": 21.9497,
        "lng": 89.1833,
        "bbox": [21.50, 22.40, 88.00, 89.90],
        "areaKm2": 10000.0,
        "elevationMeters": 3,
    },
    "ladakh": {
        "displayName": "Ladakh, India",
        "regionName": "Ladakh",
        "state": "Ladakh",
        "lat": 34.1526,
        "lng": 77.5771,
        "bbox": [32.00, 36.00, 75.00, 80.00],
        "areaKm2": 59146.0,
        "elevationMeters": 3500,
    },
    "assam": {
        "displayName": "Assam, India",
        "regionName": "Assam",
        "state": "Assam",
        "lat": 26.2006,
        "lng": 92.9376,
        "bbox": [24.00, 28.00, 89.70, 96.00],
        "areaKm2": 78438.0,
        "elevationMeters": 100,
    },
    "bhopal": {
        "displayName": "Bhopal, Madhya Pradesh, India",
        "regionName": "Bhopal",
        "state": "Madhya Pradesh",
        "lat": 23.2599,
        "lng": 77.4126,
        "bbox": [23.15, 23.35, 77.30, 77.55],
        "areaKm2": 285.9,
        "elevationMeters": 527,
    },
    "varanasi": {
        "displayName": "Varanasi, Uttar Pradesh, India",
        "regionName": "Varanasi",
        "state": "Uttar Pradesh",
        "lat": 25.3176,
        "lng": 82.9739,
        "bbox": [25.25, 25.40, 82.85, 83.10],
        "areaKm2": 112.3,
        "elevationMeters": 81,
    },
    "uttarakhand": {
        "displayName": "Uttarakhand, India",
        "regionName": "Uttarakhand",
        "state": "Uttarakhand",
        "lat": 30.0668,
        "lng": 79.0193,
        "bbox": [28.70, 31.45, 77.55, 81.05],
        "areaKm2": 53483.0,
        "elevationMeters": 1850,
    },
    "goa": {
        "displayName": "Goa, India",
        "regionName": "Goa",
        "state": "Goa",
        "lat": 15.2993,
        "lng": 74.1240,
        "bbox": [14.90, 15.80, 73.65, 74.35],
        "areaKm2": 3702.0,
        "elevationMeters": 80,
    },
    "india": {
        "displayName": "India (Subcontinent)",
        "regionName": "India",
        "state": "National",
        "lat": 20.5937,
        "lng": 78.9629,
        "bbox": [8.07, 37.10, 68.11, 97.41],
        "areaKm2": 3287263.0,
        "elevationMeters": 400,
    },
}

GEOCODE_CACHE: dict[str, LocationMetadata] = {}


def format_coords(lat: float, lng: float) -> str:
    lat_dir = "N" if lat >= 0 else "S"
    lng_dir = "E" if lng >= 0 else "W"
    return f"{abs(lat):.4f}° {lat_dir}, {abs(lng):.4f}° {lng_dir}"


def find_offline_region(query_text: str) -> LocationMetadata | None:
    norm = query_text.lower().strip()
    # Check exact keys or substrings
    for key, data in INDIA_REGIONS.items():
        if key in norm or norm in key:
            return LocationMetadata(
                displayName=data["displayName"],
                regionName=data["regionName"],
                state=data["state"],
                lat=data["lat"],
                lng=data["lng"],
                boundingBox=data["bbox"],
                areaKm2=data["areaKm2"],
                elevationMeters=data["elevationMeters"],
                coordinatesDisplay=format_coords(data["lat"], data["lng"]),
            )
    return None


async def resolve_location(location_name: str, question_context: str = "") -> LocationMetadata:
    cache_key = f"{location_name}:{question_context}".lower().strip()
    if cache_key in GEOCODE_CACHE:
        return GEOCODE_CACHE[cache_key]

    # 1. Try finding in offline regional catalog first for maximum speed
    offline_match = find_offline_region(location_name) or find_offline_region(question_context)
    if offline_match and location_name.lower() not in ["india", "all"]:
        GEOCODE_CACHE[cache_key] = offline_match
        return offline_match

    # 2. Query OpenStreetMap Nominatim with 2s timeout
    search_term = location_name if location_name and location_name.lower() != "india" else question_context
    search_term = re.sub(r"(show|find|detect|where|is|near|in|at|between|loss|gain|water|vegetation|construction)", "", search_term, flags=re.I).strip()
    if not search_term:
        search_term = location_name or "India"

    try:
        url = f"https://nominatim.openstreetmap.org/search?q={search_term}&format=json&addressdetails=1&limit=1"
        headers = {"User-Agent": "SatQuery-AI-Geospatial-Engine/1.0"}
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                results = resp.json()
                if results and len(results) > 0:
                    item = results[0]
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    bbox_raw = item.get("boundingbox", [lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1])
                    bbox = [float(b) for b in bbox_raw]
                    address = item.get("address", {})
                    state = address.get("state") or address.get("region") or "India"
                    display_name = item.get("display_name", f"{search_term}, India")
                    # Shorten display name to first 3 segments
                    short_display = ", ".join(display_name.split(",")[:3])

                    loc = LocationMetadata(
                        displayName=short_display,
                        regionName=address.get("city") or address.get("town") or address.get("state") or search_term.title(),
                        state=state,
                        lat=lat,
                        lng=lon,
                        boundingBox=bbox,
                        areaKm2=round(max(10.0, abs((bbox[1] - bbox[0]) * (bbox[3] - bbox[2]) * 111 * 111)), 1),
                        elevationMeters=150,
                        coordinatesDisplay=format_coords(lat, lon),
                    )
                    GEOCODE_CACHE[cache_key] = loc
                    return loc
    except Exception:
        pass

    # 3. Default fallback to standard regional match or National view
    fallback = offline_match or find_offline_region("odisha") or LocationMetadata(
        displayName="Odisha, India",
        regionName="Odisha",
        state="Odisha",
        lat=20.2961,
        lng=85.8245,
        boundingBox=[17.78, 22.57, 81.37, 87.53],
        areaKm2=155707.0,
        elevationMeters=158,
        coordinatesDisplay=format_coords(20.2961, 85.8245),
    )
    GEOCODE_CACHE[cache_key] = fallback
    return fallback
