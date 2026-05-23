from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, is_guest
from ..models.user import User
from ..schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_public(user: User, *, guest: bool = False) -> UserPublic:
    return UserPublic(
        userId=user.id,
        username=user.username,
        nickname=user.nickname or user.username,
        isGuest=guest,
    )


@router.post("/register", response_model=TokenResponse, response_model_by_alias=True)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "用户名已被占用")

    user = User(
        id=f"user_{uuid4().hex[:10]}",
        username=payload.username,
        password_hash=auth_service.hash_password(payload.password),
        nickname=payload.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_service.create_access_token(user.id)
    return TokenResponse(accessToken=token, user=_to_public(user))


@router.post("/login", response_model=TokenResponse, response_model_by_alias=True)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not auth_service.verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "用户名或密码错误")

    token = auth_service.create_access_token(user.id)
    return TokenResponse(accessToken=token, user=_to_public(user))


@router.get("/me", response_model=UserPublic, response_model_by_alias=True)
def me(user: User = Depends(get_current_user)) -> UserPublic:
    return _to_public(user, guest=is_guest(user))
