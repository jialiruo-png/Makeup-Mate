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
