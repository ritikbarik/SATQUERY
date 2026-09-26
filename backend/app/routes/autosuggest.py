"""
Autosuggest / Autocomplete route
=================================
Proxies place name autosuggest to Nominatim (with browser User-Agent for India-focused results).
Falls back gracefully when network is unavailable.

Used by HeroQuery.tsx to power the live search dropdown.
"""

import httpx
from fastapi import APIRouter

from app.services.geocoding_service import INDIA_REGIONS

router = APIRouter(prefix="/api", tags=["autosuggest"])


@router.get("/autosuggest")
async def autosuggest(q: str = "", limit: int = 8):
    """
    Return place name suggestions for the given query string.
    Combines fast offline all-India dataset with live Nominatim search.
    """
    q_clean = q.strip().lower()
    if not q_clean or len(q_clean) < 2:
        return {"suggestions": []}

    suggestions = []
    seen_names = set()

    # 1. Fast offline matching across curated Indian cities, districts, states & water bodies
    for key, data in INDIA_REGIONS.items():
        if q_clean in key or q_clean in data["displayName"].lower() or q_clean in data.get("regionName", "").lower():
            p_name = data.get("regionName") or data["displayName"].split(",")[0]
            if p_name.lower() not in seen_names:
                seen_names.add(p_name.lower())
                suggestions.append({
                    "placeName": p_name,
                    "placeAddress": data.get("state", "India") + ", India" if data.get("state") else "India",
                    "lat": data["lat"],
                    "lng": data["lng"],
                    "bbox": data["bbox"],
                    "type": "city" if data.get("elevationMeters") else "region",
                })
                if len(suggestions) >= limit:
                    break

    # 2. Live Nominatim geocoding if under limit
    if len(suggestions) < limit:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{q.strip()}, India",
            "format": "json",
            "addressdetails": "1",
            "limit": str(min(limit - len(suggestions), 8)),
            "countrycodes": "in",
            "dedupe": "1",
        }
        headers = {
            "User-Agent": "SatQuery-AI-Geospatial-Engine/2.0 (Mozilla/5.0 Windows NT 10.0)"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    results = resp.json()
                    # Prioritize city/town center over county/district boundaries
                    def _rank_sugg(it):
                        t = it.get("type", "").lower()
                        c = it.get("class", "").lower()
                        if c == "place" and t in ["city", "town"]:
                            return 0
                        if c == "place" or t in ["city", "town", "suburb", "village"]:
                            return 1
                        if c == "boundary" or t == "administrative":
                            return 3
                        return 2
                    results.sort(key=_rank_sugg)
                    for item in results:
                        address = item.get("address", {})
                        place_name = (
                            address.get("city")
                            or address.get("town")
                            or address.get("village")
                            or address.get("county")
                            or address.get("state_district")
                            or item.get("display_name", "").split(",")[0]
                        )
                        if place_name and place_name.lower() not in seen_names:
                            seen_names.add(place_name.lower())
                            parts = [
                                address.get("state_district", ""),
                                address.get("state", ""),
                                "India",
                            ]
                            place_address = ", ".join(p for p in parts if p)
                            
                            bbox_val = None
                            raw_bbox = item.get("boundingbox")
                            if raw_bbox and len(raw_bbox) == 4:
                                bbox_val = [float(raw_bbox[0]), float(raw_bbox[1]), float(raw_bbox[2]), float(raw_bbox[3])]
                            
                            suggestions.append({
                                "placeName": place_name,
                                "placeAddress": place_address,
                                "lat": float(item.get("lat")),
                                "lng": float(item.get("lon")),
                                "bbox": bbox_val,
                                "type": item.get("type", "place"),
                            })
                            if len(suggestions) >= limit:
                                break
        except Exception as e:
            print(f"[Autosuggest] Live search note: {e}")

    return {"suggestions": suggestions}
