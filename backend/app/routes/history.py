from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models.user import User
from ..schemas.common import OkResponse
from ..schemas.history import HistoryListResponse
from ..services import history_repository

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryListResponse, response_model_by_alias=True)
def list_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HistoryListResponse:
    return HistoryListResponse(items=history_repository.list_for_user(db, user.id))


@router.delete("/{item_id}", response_model=OkResponse)
def delete_history(
    item_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OkResponse:
    ok = history_repository.delete_item(db, user_id=user.id, item_id=item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="历史不存在")
    db.commit()
    return OkResponse(ok=True)
