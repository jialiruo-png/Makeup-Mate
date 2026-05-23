"""阿里云 DashScope · Qwen-VL-Max 调用封装。

只对外暴露两个函数：
- analyze_makeup_image(image_path, prompt) -> dict  （图 → 妆容卡片 JSON）
- chat_text(user_message, system, history) -> str  （文本对话）

如果环境变量没配 DASHSCOPE_API_KEY，调用方应自行 fallback 到 mock。
"""
from __future__ import annotations

import base64
import json
import logging
from pathlib import Path

import httpx

from ..config import get_settings

log = logging.getLogger("makeup-mate.qwen")

_settings = get_settings()

_TIMEOUT = httpx.Timeout(connect=10.0, read=60.0, write=30.0, pool=10.0)


class QwenUnavailable(RuntimeError):
    """API key 未配 / 网络不通 等情况，让上层走 mock。"""


def _require_key() -> str:
    key = _settings.dashscope_api_key
    if not key:
        raise QwenUnavailable("DASHSCOPE_API_KEY 未配置")
    return key


def _image_data_url(path: str) -> str:
    p = Path(path)
    ext = p.suffix.lower().lstrip(".") or "jpeg"
    if ext == "jpg":
        ext = "jpeg"
    b64 = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:image/{ext};base64,{b64}"


def analyze_makeup_image(image_path: str, prompt: str) -> dict:
    """让 Qwen-VL-Max 看图 + 按 prompt 输出 JSON。失败抛 QwenUnavailable。"""
    key = _require_key()
    payload = {
        "model": _settings.qwen_vl_model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": _image_data_url(image_path)}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        "response_format": {"type": "json_object"},
    }
    try:
        with httpx.Client(base_url=_settings.dashscope_base_url, timeout=_TIMEOUT) as client:
            resp = client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        log.warning("Qwen-VL request failed: %s", exc)
        raise QwenUnavailable(str(exc)) from exc

    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        log.warning("Qwen-VL response shape unexpected: %s", data)
        raise QwenUnavailable("response missing choices.message.content") from exc

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        # 偶尔模型会把 JSON 包在 ```json ... ``` 里，剥一层
        stripped = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            log.warning("Qwen-VL returned non-JSON: %s", text[:300])
            raise QwenUnavailable("model did not return valid JSON") from exc


def chat_text(user_message: str, system: str, history: list[dict] | None = None) -> str:
    """让 Qwen-VL-Max 走纯文本对话。失败抛 QwenUnavailable。"""
    key = _require_key()
    messages: list[dict] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    try:
        with httpx.Client(base_url=_settings.dashscope_base_url, timeout=_TIMEOUT) as client:
            resp = client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={"model": _settings.qwen_vl_model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError) as exc:
        log.warning("Qwen chat request failed: %s", exc)
        raise QwenUnavailable(str(exc)) from exc
