# SatQuery AI

SatQuery AI is now organized as a full-stack prototype:

```txt
satquery-ai/
├── frontend/
└── backend/
```

Architecture:

```txt
React -> useSatQuery.ts -> POST /api/query -> FastAPI -> Query Parser -> Analysis Engine -> GeoJSON -> React -> Leaflet + Analysis Cards
```

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```txt
http://localhost:5173/
```

The frontend uses `frontend/.env`:

```txt
VITE_API_URL=http://localhost:8000
```

## Current Functionality

- `POST /api/query` accepts a question and location.
- Deterministic parser maps supported questions to task/target intents.
- Analysis engine returns stable sample statistics.
- GeoJSON service returns valid FeatureCollections for vegetation, water, built-up, decrease, increase, and boundary layers.
- React updates analysis cards, confidence, answer text, map overlays, and recent queries from the API.
- If the backend is unavailable, the UI shows a clean fallback message and preserves state.
