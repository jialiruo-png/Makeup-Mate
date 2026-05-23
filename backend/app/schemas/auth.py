from pydantic import Field, field_validator

from .common import CamelModel


_USERNAME_RE = r"^[A-Za-z0-9_]{3,20}$"


class RegisterRequest(CamelModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def _check_username(cls, v: str) -> str:
        import re

        v = v.strip()
        if not re.match(_USERNAME_RE, v):
            raise ValueError("用户名需为 3-20 位字母、数字或下划线")
        return v

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        if len(v) < 6 or len(v) > 64:
            raise ValueError("密码长度需在 6-64 位之间")
        return v


class LoginRequest(CamelModel):
    username: str
    password: str


class UserPublic(CamelModel):
    user_id: str = Field(alias="userId")
    username: str
    nickname: str
    is_guest: bool = Field(default=False, alias="isGuest")


class TokenResponse(CamelModel):
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="Bearer", alias="tokenType")
    user: UserPublic
