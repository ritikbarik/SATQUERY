import os
import json
import time
import httpx

STATES = [
    "bihar", "maharashtra", "karnataka", "tamil nadu", "gujarat",
    "assam", "kerala", "uttar pradesh", "punjab", "west bengal",
    "rajasthan", "madhya pradesh", "telangana", "andhra pradesh",
    "himachal pradesh", "uttarakhand", "chhattisgarh", "jharkhand",
    "haryana", "goa", "delhi", "sikkim", "meghalaya", "manipur",
    "mizoram", "nagaland", "tripura", "arunachal pradesh", "jammu and kashmir", "ladakh"
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "boundaries")
os.makedirs(OUT_DIR, exist_ok=True)

headers = {
    "User-Agent": "SatQuery-AI-Geospatial-System/2.0 (student-academic-research; contact: admin@satquery.ai)"
}

for st in STATES:
    slug = st.replace(" ", "_")
    path = os.path.join(OUT_DIR, f"{slug}.json")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        print(f"Already cached: {st}")
        continue
    try:
        q = st.replace(" ", "+")
        url = f"https://nominatim.openstreetmap.org/search?q={q},+India&polygon_geojson=1&format=json"
        resp = httpx.get(url, headers=headers, timeout=12.0)
        if resp.status_code == 200:
            data = resp.json()
            # find item with Polygon or MultiPolygon
            chosen = None
            for item in data:
                gt = item.get("geojson", {}).get("type")
                if gt in ["Polygon", "MultiPolygon"]:
                    chosen = item["geojson"]
                    break
            if not chosen and data and "geojson" in data[0]:
                chosen = data[0]["geojson"]
            
            if chosen:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(chosen, f)
                print(f"Cached {st} ({chosen.get('type')}) -> {os.path.getsize(path)} bytes")
            else:
                print(f"No polygon for {st}")
        time.sleep(1.0)
    except Exception as e:
        print(f"Error caching {st}: {e}")
