from datetime import datetime, timezone, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import get_settings
from ..schemas.media import MediaAsset

router = APIRouter(prefix="/media", tags=["media"])

_settings = get_settings()

_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
_VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm"}


def _detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext in _IMAGE_EXT:
        return "image"
    if ext in _VIDEO_EXT:
        return "video"
    raise HTTPException(status_code=400, detail="不支持的文件类型")


@router.post("/upload", response_model=MediaAsset, response_model_by_alias=True)
async def upload(
    file: UploadFile = File(...),
    purpose: str = Form(...),
    sessionId: str | None = Form(default=None),
    retentionPolicy: str = Form(default="session_only"),
) -> MediaAsset:
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")
    file_type = _detect_file_type(file.filename)

    media_id = f"media_{uuid4().hex[:10]}"
    ext = Path(file.filename).suffix.lower()
    target = _settings.storage_path / f"{media_id}{ext}"

    content = await file.read()
    target.write_bytes(content)

    expires_at = datetime.now(timezone(timedelta(hours=8))) + timedelta(hours=24)

    return MediaAsset(
        mediaAssetId=media_id,
        fileType=file_type,  # type: ignore[arg-type]
        purpose=purpose,  # type: ignore[arg-type]
        analysisStatus="pending",
        retentionPolicy=retentionPolicy,  # type: ignore[arg-type]
        expiresAt=expires_at,
    )
