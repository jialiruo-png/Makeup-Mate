"""长期档案 / AI 记忆服务。

第一阶段只 mock 默认用户档案；落地到 beauty_profiles 与 memory_items 表的逻辑后续补。
"""

from ..schemas.beauty_profile import (
    BeautyProfile,
    MeResponse,
    PrivacySettings,
)


def get_default_profile() -> BeautyProfile:
    return BeautyProfile(
        faceShape="方圆脸",
        skinTone="自然偏暖",
        featureStyle="淡颜偏自然",
        eyeType="内双",
        preferredBlushPosition="眼下外侧上移",
        preferredEyeliner="后半段短眼线",
        preferredLipColors=["奶茶色", "豆沙色", "低饱和红棕"],
        avoidStyles=["重修容", "过长上挑眼线"],
    )


def get_me(user_id: str) -> MeResponse:
    return MeResponse(
        userId=user_id,
        nickname="妆搭体验用户",
        avatarUrl=None,
        profileCompleteness=0.4,
        beautyProfile=get_default_profile(),
        privacy=PrivacySettings(
            saveProfileEnabled=True,
            memoryEnabled=True,
            saveRawPhoto=False,
        ),
    )
