from fastapi import APIRouter, HTTPException

from ..schemas.makeup_card import (
    AnalyzeRequest,
    AnalyzeResponse,
    MakeupCard,
    ShareResponse,
)
from ..services import ai_service, makeup_card_validator, share_service

router = APIRouter(prefix="/makeup-cards", tags=["makeup-cards"])

# 临时内存缓存。第一阶段先用，后续替换为 SQLAlchemy 落库。
_CARD_CACHE: dict[str, MakeupCard] = {}


@router.post("/analyze", response_model=AnalyzeResponse, response_model_by_alias=True)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    if payload.source_type == "link" and not payload.source_url:
        raise HTTPException(status_code=400, detail="请先粘贴一个美妆内容链接")
    if payload.source_type in ("image", "video") and not payload.media_asset_id:
        raise HTTPException(status_code=400, detail="缺少上传的 mediaAssetId")

    res = ai_service.analyze_makeup(payload)
    res.card = makeup_card_validator.validate_with_evidence(res.card, res.video_evidence)
    _CARD_CACHE[res.card.card_id] = res.card
    return res


@router.get("/{card_id}", response_model=MakeupCard, response_model_by_alias=True)
def get_card(card_id: str) -> MakeupCard:
    card = _CARD_CACHE.get(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="卡片不存在")
    return card


@router.post(
    "/{card_id}/share",
    response_model=ShareResponse,
    response_model_by_alias=True,
)
def share(card_id: str) -> ShareResponse:
    card = _CARD_CACHE.get(card_id)
    title = card.title if card else "我的妆容"
    return share_service.share_card(card_id, title)
