from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    BigEarthNetPatchDetail,
    BigEarthNetPatchSummary,
    BigEarthNetStats,
)
from app.services.bigearthnet_service import bigearthnet_service

router = APIRouter(prefix="/api/bigearthnet", tags=["bigearthnet"])


@router.get("/stats", response_model=BigEarthNetStats)
async def get_stats() -> BigEarthNetStats:
    return bigearthnet_service.get_dataset_stats()


@router.get("/patches", response_model=list[BigEarthNetPatchSummary])
async def get_patches(country: str | None = None, limit: int = 20) -> list[BigEarthNetPatchSummary]:
    return bigearthnet_service.get_sample_patches(country=country, limit=limit)


@router.get("/search", response_model=list[BigEarthNetPatchSummary])
async def search_patches(q: str, country: str | None = None, limit: int = 10) -> list[BigEarthNetPatchSummary]:
    return bigearthnet_service.search_patches(query_text=q, country=country, limit=limit)


@router.get("/patch/{patch_id}", response_model=BigEarthNetPatchDetail)
async def get_patch(patch_id: str) -> BigEarthNetPatchDetail:
    detail = bigearthnet_service.get_patch_detail(patch_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Patch {patch_id} not found in BigEarthNet")
    return detail
