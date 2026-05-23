"""分享卡片服务。

第一阶段 P0 只返回分享文案和模拟图片 URL；P1 再做真实 canvas / 服务端图片生成。
"""

from ..schemas.makeup_card import ShareResponse


def share_card(card_id: str, title: str) -> ShareResponse:
    return ShareResponse(
        shareUrl=f"https://makeup-mate.example.com/share/{card_id}",
        shareText=f"我用妆搭 Makeup Mate 解析了一张「{title}」，分享给你看看",
        imageUrl=None,
    )
