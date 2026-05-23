"""一次性脚本：drop 所有业务表，重新按当前 models 建表。

部署后在服务器上跑一次：
    cd /opt/makeup-mate/backend
    python -m scripts.reset_db

警告：会清空 users / chat_sessions / chat_messages / media_assets 等所有业务数据。
"""
from app.db import Base, engine
import app.models  # noqa: F401  触发模型注册


def main() -> None:
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    main()
