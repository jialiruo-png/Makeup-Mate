from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

from ..schemas.common import OkResponse
from ..schemas.history import HistoryItem, HistoryListResponse

router = APIRouter(prefix="/history", tags=["history"])

# 第一阶段 mock 一组历史。后续接 makeup_cards / chat_sessions JOIN 视图。
_DELETED: set[str] = set()


def _mock_items() -> list[HistoryItem]:
    now = datetime.now(timezone(timedelta(hours=8)))
    items = [
        HistoryItem(
            itemId="hist_001",
            cardId="card_demo_001",
            sessionId=None,
            title="清冷感通勤妆",
            source="link",
            status="analyzed",
            createdAt=now - timedelta(hours=2),
        ),
        HistoryItem(
            itemId="hist_002",
            cardId="card_demo_002",
            sessionId="chat_demo_002",
            title="桃花约会妆",
            source="inspiration",
            status="imported",
            createdAt=now - timedelta(days=1),
        ),
    ]
    return [i for i in items if i.item_id not in _DELETED]


@router.get("", response_model=HistoryListResponse, response_model_by_alias=True)
def list_history() -> HistoryListResponse:
    return HistoryListResponse(items=_mock_items())


@router.delete("/{item_id}", response_model=OkResponse)
def delete_history(item_id: str) -> OkResponse:
    _DELETED.add(item_id)
    return OkResponse(ok=True)
