from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models.user import User
from ..schemas.makeup_card import (
    AnalyzeRequest,
    AnalyzeResponse,
    CardBackgroundRequest,
    CardBackgroundResponse,
    MakeupCard,
    ShareResponse,
)
from ..services import (
    ai_service,
    card_image_service,
    history_repository,
    makeup_card_repository,
    makeup_card_validator,
    qwen_client,
    share_service,
)

router = APIRouter(prefix="/makeup-cards", tags=["makeup-cards"])


@router.post("/analyze", response_model=AnalyzeResponse, response_model_by_alias=True)
def analyze(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AnalyzeResponse:
    if payload.source_type == "link" and not payload.source_url:
        raise HTTPException(status_code=400, detail="请先粘贴一个美妆内容链接")
    if payload.source_type in ("image", "video") and not payload.media_asset_id:
        raise HTTPException(status_code=400, detail="缺少上传的 mediaAssetId")

    res = ai_service.analyze_makeup(payload)
    res.card = makeup_card_validator.validate_with_evidence(res.card, res.video_evidence)
    makeup_card_repository.save_card(db, res.card, user.id)
    history_repository.upsert_from_card(
        db,
        user_id=user.id,
        card_id=res.card.card_id,
        title=res.card.title,
        source=res.card.source_type,
        status="analyzed",
    )
    db.commit()
    return res


@router.post(
    "/render-background",
    response_model=CardBackgroundResponse,
    response_model_by_alias=True,
)
def render_background(payload: CardBackgroundRequest) -> CardBackgroundResponse:
    try:
        image_url, prompt = card_image_service.generate_card_background(
            payload.card,
            payload.prompt_override,
        )
    except qwen_client.QwenUnavailable as exc:
        raise HTTPException(status_code=502, detail=f"AI 背景图生成失败：{exc}") from exc
    return CardBackgroundResponse(imageUrl=image_url, prompt=prompt)


@router.get("/rendered/{file_name}")
def get_rendered(file_name: str) -> FileResponse:
    path = card_image_service.generated_image_path(file_name)
    if not path.exists():
        raise HTTPException(status_code=404, detail="rendered image not found")
    return FileResponse(path=path, media_type="image/png", filename=path.name)


@router.get("/{card_id}", response_model=MakeupCard, response_model_by_alias=True)
def get_card(card_id: str, db: Session = Depends(get_db)) -> MakeupCard:
    card = makeup_card_repository.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="卡片不存在")
    return card


@router.post(
    "/{card_id}/share",
    response_model=ShareResponse,
    response_model_by_alias=True,
)
def share(card_id: str, db: Session = Depends(get_db)) -> ShareResponse:
    card = makeup_card_repository.get_card(db, card_id)
    title = card.title if card else "我的妆容"
    return share_service.share_card(card_id, title)
