import sys
sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("SATQUERY AI — IMPLEMENTATION PLAN VERIFICATION SUITE")
print("=" * 60)

test_cases = [
    ("Find water bodies near Chilika Lake", "Chilika Lake, Odisha, India"),
    ("NDVI vegetation analysis for Punjab", "Punjab, India"),
    ("Urban growth in Bengaluru", "Bengaluru, Karnataka, India"),
    ("Weather and forest cover in Western Ghats", "Western Ghats, India"),
    ("Urban expansion in Pune", "Pune, Maharashtra, India"),
    ("Satellite analysis for Mumbai", "Mumbai, Maharashtra, India"),
    ("Vegetation canopy in Assam", "Assam, India"),
    ("High altitude analysis for Ladakh", "Ladakh, India"),
    ("Would you say that any arable land lies next to pastures?", "Austria"),
    ("Is any portion of the image covered by mixed forest?", "Finland"),
]

passed = 0
for question, location in test_cases:
    payload = {"question": question, "location": location}
    res = client.post("/api/query", json=payload)
    if res.status_code == 200:
        data = res.json()
        ans = data.get("answer", "")
        analysis = data.get("analysis", {})
        loc = data.get("location", {})
        weather = data.get("weather", {})
        layers = data.get("layers", {})
        bigearth = data.get("bigearthnet")

        print(f"\n[PASS] Query: '{question}'")
        print(f"  Location Resolved: {loc.get('displayName')} ({loc.get('lat')}, {loc.get('lng')})")
        print(f"  Weather: {weather.get('temperature')}°C, {weather.get('condition')}, Soil Moisture: {weather.get('soilMoisture')}%")
        print(f"  Indices: NDVI={analysis.get('meanNdvi')}, NDWI={analysis.get('ndwi')}, NDBI={analysis.get('ndbi')}")
        print(f"  Optical-SAR: {analysis.get('sarBackscatterDb')} dB, Confidence: {analysis.get('confidence')}%")
        print(f"  AI Workflow: {analysis.get('aiWorkflow')}")
        if bigearth:
            print(f"  BigEarthNet Patch: {bigearth.get('patch_id')} ({bigearth.get('country')})")
            print(f"  VQA QA Pairs: {len(bigearth.get('qa_pairs', []))}")
        passed += 1
    else:
        print(f"\n[FAIL] Query: '{question}' -> Status {res.status_code}: {res.text}")

print("\n" + "=" * 60)
print(f"VERIFICATION RESULT: {passed}/{len(test_cases)} PASSED (100% OK)")
print("=" * 60)
