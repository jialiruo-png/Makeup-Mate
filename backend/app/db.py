from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

_settings = get_settings()

_engine_kwargs: dict = {"pool_pre_ping": True}
if _settings.database_url.startswith("sqlite"):
    # SQLite 单进程多线程需要这个
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(_settings.database_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # 引入所有模型以触发表注册
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
