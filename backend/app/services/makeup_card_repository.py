"""MakeupCard 持久化层：schema ↔ ORM 互转 + 读写封装。

接 RDS，不再用 in-memory 缓存。多 worker 安全。
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..models.makeup_card import MakeupCard as MakeupCardModel
from ..schemas.makeup_card import (
    EvidenceSummary,
    MakeupCard,
    MakeupStep,
)


def _step_to_dict(s: MakeupStep) -> dict:
    return {
        "stepNo": s.step_no,
        "part": s.part,
        "instruction": s.instruction,
        "tips": list(s.tips or []),
    }


def _dict_to_step(d: dict) -> MakeupStep:
    return MakeupStep(
        stepNo=int(d.get("stepNo", 0)),
        part=str(d.get("part", "")),
        instruction=str(d.get("instruction", "")),
        tips=list(d.get("tips") or []),
    )


def save_card(db: Session, card: MakeupCard, user_id: str) -> MakeupCardModel:
    """新建或覆盖一条卡片，commit 由调用方负责。"""
    row = db.get(MakeupCardModel, card.card_id)
    if row is None:
        row = MakeupCardModel(id=card.card_id, user_id=user_id)
        db.add(row)

    row.user_id = user_id
    row.source_type = card.source_type
    row.source_platform = card.source_platform
    row.source_url = card.source_url
    row.source_asset_id = card.source_asset_id
    row.title = card.title
    row.style_tags = list(card.style_tags)
    row.difficulty = card.difficulty
    row.estimated_time = card.estimated_time
    row.scenes = list(card.scenes)
    row.product_types = list(card.product_types)
    row.steps = [_step_to_dict(s) for s in card.steps]
    row.risk_points = list(card.risk_points)
    row.ai_tip = card.ai_tip
    row.confidence = card.confidence
    row.evidence_summary = card.evidence_summary.model_dump(by_alias=True)
    db.flush()
    return row


def row_to_schema(row: MakeupCardModel) -> MakeupCard:
    evidence_raw = row.evidence_summary or {}
    return MakeupCard(
        cardId=row.id,
        sourceType=row.source_type,  # type: ignore[arg-type]
        sourcePlatform=row.source_platform,
        sourceUrl=row.source_url,
        sourceAssetId=row.source_asset_id,
        title=row.title,
        styleTags=list(row.style_tags or []),
        difficulty=row.difficulty,
        estimatedTime=row.estimated_time,
        scenes=list(row.scenes or []),
        productTypes=list(row.product_types or []),
        steps=[_dict_to_step(s) for s in (row.steps or [])],
        riskPoints=list(row.risk_points or []),
        aiTip=row.ai_tip or "",
        confidence=float(row.confidence or 0.0),
        evidenceSummary=EvidenceSummary(
            hasVideoEvidence=bool(evidence_raw.get("hasVideoEvidence", False)),
            supportLevel=evidence_raw.get("supportLevel", "mock"),
        ),
        createdAt=row.created_at,
    )


def get_card(db: Session, card_id: str) -> MakeupCard | None:
    row = db.get(MakeupCardModel, card_id)
    return row_to_schema(row) if row else None
