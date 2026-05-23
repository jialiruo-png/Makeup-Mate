"""手动清理过期媒体文件。

逻辑：
    1. 查 media_assets.expires_at < now() 的记录。
    2. 删 ECS 磁盘上的物理文件（兼容旧的绝对路径与新的相对 key）。
    3. 删对应 RDS 记录。

部署后手动执行：
    cd /opt/makeup-mate/backend
    python -m scripts.cleanup_media           # 真删
    python -m scripts.cleanup_media --dry-run # 只看不删

注意：本脚本不动 chat_messages / makeup_cards 等业务表。
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

from app.config import get_settings
from app.db import SessionLocal
from app.models.media_asset import MediaAsset


def _resolve_path(file_url: str, storage_dir: Path) -> Path:
    """老数据存绝对路径，新数据存相对 key，做兼容。"""
    p = Path(file_url or "")
    if p.is_absolute():
        return p
    return storage_dir / file_url


def main() -> None:
    parser = argparse.ArgumentParser(description="清理过期的 media_assets 与磁盘文件")
    parser.add_argument("--dry-run", action="store_true", help="只打印将要删除的内容，不实际删")
    args = parser.parse_args()

    settings = get_settings()
    storage_dir = settings.storage_path

    # 用东八区当前时间，与 media.py 写入逻辑保持一致
    now = datetime.now(timezone(timedelta(hours=8))).replace(tzinfo=None)

    db = SessionLocal()
    try:
        rows = (
            db.query(MediaAsset)
            .filter(MediaAsset.expires_at.isnot(None))
            .filter(MediaAsset.expires_at < now)
            .all()
        )

        if not rows:
            print(f"[{now}] no expired media_assets, nothing to do.")
            return

        file_removed = 0
        file_missing = 0
        db_removed = 0

        for row in rows:
            p = _resolve_path(row.file_url, storage_dir)
            existed = p.exists()

            print(
                f"  - {row.id}  expires_at={row.expires_at}  "
                f"path={p}  exists={existed}"
            )

            if args.dry_run:
                continue

            if existed:
                try:
                    p.unlink()
                    file_removed += 1
                except OSError as e:
                    print(f"    ! failed to remove {p}: {e}")
            else:
                file_missing += 1

            db.delete(row)
            db_removed += 1

        if args.dry_run:
            print(f"[dry-run] {len(rows)} rows would be removed.")
            return

        db.commit()
        print(
            f"[done] db_removed={db_removed}  "
            f"file_removed={file_removed}  file_missing={file_missing}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
