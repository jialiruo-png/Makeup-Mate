from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "makeup-mate-backend"
    app_version: str = "0.1.0"
    app_env: str = "local"
    log_level: str = "INFO"

    database_url: str = "sqlite:///./storage/makeup_mate.db"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    default_user_id: str = "user_demo"

    storage_dir: str = "./storage/tmp"

    # ---------- AI (Qwen-VL-Max via DashScope 原生 or OpenAI 兼容中转) ----------
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_vl_model: str = "qwen-vl-max"

    # ---------- 公网回调地址（给 Qwen 拉图用） ----------
    # 形如 http://121.43.144.91:8080。Qwen 会去 {public_base_url}/api/media/{id}/raw 拉图
    public_base_url: str = ""

    # ---------- 鉴权 ----------
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7
    guest_user_id: str = "guest"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def storage_path(self) -> Path:
        p = Path(self.storage_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
