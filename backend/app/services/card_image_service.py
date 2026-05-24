"""AI-generated visual backgrounds for shareable makeup cards.

The image model draws only the decorative background. Frontend canvas still
renders all Chinese card text so the final image stays readable and accurate.
"""

from __future__ import annotations

import base64
import logging
from pathlib import Path
from uuid import uuid4

import httpx

from ..config import get_settings
from ..schemas.makeup_card import MakeupCard
from .qwen_client import QwenUnavailable

log = logging.getLogger("makeup-mate.card-image")

_settings = get_settings()
_TIMEOUT = httpx.Timeout(connect=10.0, read=180.0, write=60.0, pool=10.0)


def _require_key() -> str:
    key = _settings.dashscope_api_key
    if not key:
        raise QwenUnavailable("DASHSCOPE_API_KEY 未配置")
    return key


def build_card_background_prompt(card: MakeupCard) -> str:
    tags = "、".join(card.style_tags[:5]) or "干净、日常、个人化"
    scenes = "、".join(card.scenes[:4]) or "日常、通勤"
    products = "、".join(card.product_types[:8]) or "粉饼、腮红刷、眼影盘、唇泥、眼线笔"

    return f"""为一款中文美妆陪伴应用「妆搭 Makeup Mate」绘制一张精美的个人妆容方案卡片背景图，竖版移动端分享卡片，比例 3:4，高清精致。

业务语境：这是一张「{card.title}」的个人妆容复刻方案背景图。妆容风格关键词：{tags}。适合场景：{scenes}。会用到的美妆元素：{products}。

视觉内容：
- 画面中心是一张高级感妆容方案卡片的视觉底稿，但不要出现任何可读文字、不要生成中文、英文、数字或 logo。
- 卡片风格应像私人化妆师为用户整理的「我的版本」妆容档案。
- 包含柔和的美妆元素：粉饼、腮红刷、眼影盘、唇泥、细眼线笔、少量色卡、半透明便签层。
- 可以有抽象的人脸轮廓或镜面倒影，但不要画真实可识别的人脸，不要像自拍照。
- 画面要保留足够干净的留白区域，方便后续 canvas 叠加中文标题、步骤、标签和提示。
- 上方预留标题区，中部预留步骤内容区，下方预留 AI 小提示区。

审美方向：
- 高级、干净、细腻、女性友好、轻奢但不浮夸。
- 色彩使用奶油白、柔雾杏粉、低饱和玫瑰棕、浅可可、少量鼠尾草绿作为点缀。
- 光线柔和自然，材质有纸张纹理、轻微磨砂玻璃、细腻阴影。
- 构图像精品杂志内页和高端美妆工作台结合，层次丰富但不拥挤。
- 不要紫色科技风，不要夸张渐变，不要赛博风，不要网红模板感。

输出要求：
- 无文字、无字母、无数字、无水印。
- 不要真实品牌包装，不要品牌名。
- 不要人物正脸，不要过度浓妆。
- 画面清晰、精致、适合作为 canvas 卡片背景。"""


def _image_base_url() -> str:
    return _settings.dashscope_base_url.rstrip("/")


def _public_generated_url(file_name: str) -> str | None:
    if not _settings.public_base_url:
        return None
    return f"{_settings.public_base_url.rstrip('/')}/api/makeup-cards/rendered/{file_name}"


def _save_b64_image(b64_json: str) -> tuple[str, str]:
    file_name = f"card_bg_{uuid4().hex[:12]}.png"
    path = _settings.storage_path / file_name
    path.write_bytes(base64.b64decode(b64_json))
    return file_name, str(path)


def _save_remote_image(url: str) -> str:
    with httpx.Client(timeout=_TIMEOUT, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            raise QwenUnavailable(f"generated asset is not an image: {content_type}")
        content = resp.content
    file_name = f"card_bg_{uuid4().hex[:12]}.png"
    path = _settings.storage_path / file_name
    path.write_bytes(content)
    return file_name


def _served_image_url(file_name: str) -> str:
    public_url = _public_generated_url(file_name)
    if public_url:
        return public_url
    return f"/api/makeup-cards/rendered/{file_name}"


def generate_card_background(card: MakeupCard, prompt_override: str | None = None) -> tuple[str, str]:
    key = _require_key()
    prompt = prompt_override.strip() if prompt_override and prompt_override.strip() else build_card_background_prompt(card)
    payload = {
        "model": _settings.image_generation_model,
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
    }

    try:
        with httpx.Client(base_url=_image_base_url(), timeout=_TIMEOUT) as client:
            resp = client.post(
                "/images/generations",
                headers={"Authorization": f"Bearer {key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        log.warning("card background generation failed: %s", exc)
        raise QwenUnavailable(str(exc)) from exc

    item = (data.get("data") or [{}])[0]
    if item.get("url"):
        try:
            file_name = _save_remote_image(str(item["url"]))
            return _served_image_url(file_name), prompt
        except httpx.HTTPError as exc:
            log.warning("generated image download failed: %s", exc)
            raise QwenUnavailable(str(exc)) from exc
    if item.get("b64_json"):
        file_name, _path = _save_b64_image(str(item["b64_json"]))
        return _served_image_url(file_name), prompt

    raise QwenUnavailable("image generation response missing url/b64_json")


def generated_image_path(file_name: str) -> Path:
    if "/" in file_name or "\\" in file_name or not file_name.startswith("card_bg_"):
        raise FileNotFoundError(file_name)
    return _settings.storage_path / file_name
