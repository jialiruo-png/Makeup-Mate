"""阿里云 DashScope · Qwen-VL-Max 调用封装。

只对外暴露两个函数：
- analyze_makeup_image(image_url, prompt) -> dict  （图 URL → 妆容卡片 JSON）
- chat_text(user_message, system, history) -> str  （文本对话）

注意：image_url 必须是公网 HTTP(S) URL，不要传 base64 data URL —— 部分 OpenAI 兼容
中转站（如 openai-next）会拦截 data URL，得让 Qwen 自己去拉。
"""
from __future__ import annotations

import json
import logging

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


def analyze_makeup_image(image_url: str, prompt: str) -> dict:
    """让 Qwen-VL-Max 看图 + 按 prompt 输出 JSON。失败抛 QwenUnavailable。

    image_url 必须是 Qwen 能直接 GET 到的公网 URL（不能是 data:）。
    """
    key = _require_key()
    payload = {
        "model": _settings.qwen_vl_model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
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
