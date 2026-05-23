from datetime import datetime
from typing import Literal
from pydantic import Field
from .common import CamelModel


HistorySource = Literal["link", "image", "video", "inspiration"]
HistoryStatus = Literal["analyzed", "imported", "completed"]


class HistoryItem(CamelModel):
    item_id: str = Field(alias="itemId")
    card_id: str | None = Field(default=None, alias="cardId")
    session_id: str | None = Field(default=None, alias="sessionId")
    title: str
    source: HistorySource
    status: HistoryStatus
    created_at: datetime = Field(alias="createdAt")


class HistoryListResponse(CamelModel):
    items: list[HistoryItem]
