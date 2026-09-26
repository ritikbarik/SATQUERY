"""
Boundary API Route
===================
Provides authentic administrative border outlines (GeoJSON Polygon/MultiPolygon)
for Indian states, districts, and municipalities.
Completely replaces rough bounding-box rectangles with real borders.
"""

import os
import json
import re
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["boundary"])

BOUNDARIES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "boundaries")
os.makedirs(BOUNDARIES_DIR, exist_ok=True)

# Common name normalization map
ALIASES = {
    "orissa": "odisha",
    "delhi ncr": "delhi",
    "nct of delhi": "delhi",
    "jammu & kashmir": "jammu_and_kashmir",
    "jammu and kashmir": "jammu_and_kashmir",
    "tamilnadu": "tamil_nadu",
    "uttarpradesh": "uttar_pradesh",
    "westbengal": "west_bengal",
    "madhyapradesh": "madhya_pradesh",
    "andhrapradesh": "andhra_pradesh",
    "himachalpradesh": "himachal_pradesh",
    "bengaluru": "bengaluru",
    "bangalore": "bengaluru",
    "calcutta": "kolkata",
    "bombay": "mumbai",
    "madras": "chennai",
    "cochin": "kochi",
}


def _slugify(name: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", name.lower()).strip()
    cleaned = re.sub(r"[-\s]+", "_", cleaned)
    return ALIASES.get(cleaned, cleaned)


@router.get("/boundary")
async def get_boundary(q: str = ""):
    """
    Fetch the real boundary polygon GeoJSON for any Indian state or region.
    Serves from high-speed local disk cache; queries OSM Nominatim if not yet cached.
    """
    if not q or not q.strip():
        return {"type": "Feature", "geometry": None, "properties": {}}

    raw_query = q.strip()
    # Strip suffixes like ", India", ", Odisha", etc. for state lookup
    first_part = raw_query.split(",")[0].strip()
    slug = _slugify(first_part)

    cache_file = os.path.join(BOUNDARIES_DIR, f"{slug}.json")

    # 1. Check local boundary cache
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 100:
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                geometry = json.load(f)
            return {
                "type": "Feature",
                "properties": {
                    "name": first_part.title(),
                    "source": "cache",
                    "geometryType": geometry.get("type", "Polygon"),
                },
                "geometry": geometry,
            }
        except Exception as e:
            print(f"[Boundary API] Cache read error for {slug}: {e}")

    # 2. Live fetch from Nominatim with polygon_geojson=1
    headers = {
        "User-Agent": "SatQuery-AI-Geospatial-System/2.0 (Academic and GIS Research Engine; contact: admin@satquery.ai)"
    }
    search_q = f"{first_part}, India" if "india" not in first_part.lower() else first_part

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": search_q,
            "polygon_geojson": "1",
            "format": "json",
            "limit": "5",
            "countrycodes": "in",
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                results = resp.json()
                chosen_geom = None
                
                # Prioritize Polygon or MultiPolygon with actual borders
                for item in results:
                    gj = item.get("geojson")
                    if gj and gj.get("type") in ["Polygon", "MultiPolygon"]:
                        chosen_geom = gj
                        break

                if chosen_geom:
                    # Save to cache
                    try:
                        with open(cache_file, "w", encoding="utf-8") as f:
                            json.dump(chosen_geom, f)
                    except Exception as e:
                        print(f"[Boundary API] Cache write error: {e}")

                    return {
                        "type": "Feature",
                        "properties": {
                            "name": first_part.title(),
                            "source": "nominatim",
                            "geometryType": chosen_geom.get("type"),
                        },
                        "geometry": chosen_geom,
                    }
    except Exception as e:
        print(f"[Boundary API] Fetch error for '{q}': {e}")

    return {
        "type": "Feature",
        "properties": {"name": first_part, "source": "none"},
        "geometry": None,
    }
