import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routes import api_router
from .schemas.common import HealthResponse

settings = get_settings()
logging.basicConfig(level=settings.log_level)
log = logging.getLogger("makeup-mate")


def create_app() -> FastAPI:
    app = FastAPI(
        title="妆搭 Makeup Mate API",
        version=settings.app_version,
        description="第一阶段后端骨架。AI / MediaPipe 能力先 mock，接口结构按 PRD 稳定。",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.get("/api/health", response_model=HealthResponse, response_model_by_alias=True)
    def health() -> HealthResponse:
        return HealthResponse(ok=True, service=settings.app_name, version=settings.app_version)

    @app.on_event("startup")
    def _on_startup() -> None:
        try:
            init_db()
            log.info("DB initialized at %s", settings.database_url)
        except Exception as exc:  # 让 ECS+RDS 切换期失败也不阻塞启动
            log.warning("DB init skipped: %s", exc)

    return app


app = create_app()
