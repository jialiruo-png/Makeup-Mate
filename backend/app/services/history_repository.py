"""HistoryItem 持久化：聚合卡片/会话事件，给「我的-历史」用。

写入时机：
- analyze 成功 → upsert status="analyzed"
- create_session 时 → 若已有同 card_id 的历史则升级为 "imported" + 写 session_id；
  没有则新建一条 "imported"
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.history import HistoryItem as HistoryItemModel
from ..schemas.history import HistoryItem


_STATUS_RANK = {"analyzed": 0, "imported": 1, "completed": 2}


def _now() -> datetime:
    return datetime.now(timezone(timedelta(hours=8))).replace(tzinfo=None)


def _make_id() -> str:
    return f"hist_{uuid4().hex[:10]}"


def row_to_schema(row: HistoryItemModel) -> HistoryItem:
    return HistoryItem(
        itemId=row.id,
        cardId=row.card_id,
        sessionId=row.session_id,
        title=row.title,
        source=row.source,  # type: ignore[arg-type]
        status=row.status,  # type: ignore[arg-type]
        createdAt=row.created_at,
    )


def upsert_from_card(
    db: Session,
    *,
    user_id: str,
    card_id: str,
    title: str,
    source: str,
    status: str = "analyzed",
    session_id: str | None = None,
) -> HistoryItemModel:
    """同一张卡只保留一条历史；status 只升不降。"""
    row = (
        db.query(HistoryItemModel)
        .filter(
            HistoryItemModel.user_id == user_id,
            HistoryItemModel.card_id == card_id,
        )
        .one_or_none()
    )
    if row is None:
        row = HistoryItemModel(
            id=_make_id(),
            user_id=user_id,
            card_id=card_id,
            session_id=session_id,
            title=title,
            source=source,
            status=status,
            created_at=_now(),
        )
        db.add(row)
        db.flush()
        return row

    if _STATUS_RANK.get(status, 0) > _STATUS_RANK.get(row.status, 0):
        row.status = status
    if session_id and not row.session_id:
        row.session_id = session_id
    row.title = title
    db.flush()
    return row


def list_for_user(db: Session, user_id: str) -> list[HistoryItem]:
    rows = (
        db.execute(
            select(HistoryItemModel)
            .where(HistoryItemModel.user_id == user_id)
            .order_by(HistoryItemModel.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [row_to_schema(r) for r in rows]


def delete_item(db: Session, *, user_id: str, item_id: str) -> bool:
    row = db.get(HistoryItemModel, item_id)
    if not row or row.user_id != user_id:
        return False
    db.delete(row)
    db.flush()
    return True
