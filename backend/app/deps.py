"""FastAPI 鉴权依赖。

- get_current_user：无 token → 游客；有 token → 真实用户；token 无效 → 401
- require_real_user：游客访问 → 403
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models.user import User
from .services import auth_service

_settings = get_settings()


def _guest_user() -> User:
    u = User()
    u.id = _settings.guest_user_id
    u.username = "guest"
    u.password_hash = ""
    u.nickname = "游客"
    return u


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        return _guest_user()

    parts = authorization.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authorization 头格式错误")

    payload = auth_service.decode_token(parts[1])
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "登录已过期，请重新登录")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token 无效")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "账号不存在")
    return user


def is_guest(user: User) -> bool:
    return user.id == _settings.guest_user_id


def require_real_user(user: User = Depends(get_current_user)) -> User:
    if is_guest(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "该功能需要登录")
    return user
