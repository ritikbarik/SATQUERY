from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analysis import router as analysis_router
from app.routes.bigearthnet import router as bigearthnet_router
from app.routes.geocode import router as geocode_router
from app.routes.geojson import router as geojson_router
from app.routes.query import router as query_router
from app.routes.weather import router as weather_router

app = FastAPI(
    title="SatQuery AI Intelligence API",
    description="All-India real-time satellite intelligence and BigEarthNet VQA API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query_router)
app.include_router(geocode_router)
app.include_router(weather_router)
app.include_router(analysis_router)
app.include_router(geojson_router)
app.include_router(bigearthnet_router)
