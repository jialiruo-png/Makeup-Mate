from fastapi import APIRouter, HTTPException, Query

from ..schemas.inspiration import (
    GenerateMyVersionRequest,
    GenerateMyVersionResponse,
    InspirationListResponse,
)
from ..services import inspiration_service

router = APIRouter(prefix="/inspirations", tags=["inspirations"])


@router.get("", response_model=InspirationListResponse, response_model_by_alias=True)
def list_inspirations(
    type: str | None = Query(default=None),
    style: str | None = Query(default=None),
    scene: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
) -> InspirationListResponse:
    items = inspiration_service.list_inspirations(type, style, scene, difficulty)
    return InspirationListResponse(items=items)


@router.post(
    "/{inspiration_id}/generate-my-version",
    response_model=GenerateMyVersionResponse,
    response_model_by_alias=True,
)
def generate_my_version(
    inspiration_id: str, _payload: GenerateMyVersionRequest
) -> GenerateMyVersionResponse:
    insp = inspiration_service.get_inspiration(inspiration_id)
    if not insp:
        raise HTTPException(status_code=404, detail="灵感卡片不存在")
    return inspiration_service.generate_my_version(insp)
