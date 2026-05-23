"""MediaPipe 自拍脸部几何解析。

第一阶段返回 mock 摘要；P1 接真实 MediaPipe Face Landmarker。
"""

from ..schemas.beauty_profile import FaceGeometry, HeadPose, SuggestionAnchors


def extract_face_geometry(media_path: str | None = None) -> FaceGeometry:
    return FaceGeometry(
        faceDetected=True,
        source="mediapipe_mock",
        faceRatio="slightly_round",
        headPose=HeadPose(yaw="front", pitch="neutral"),
        suggestionAnchors=SuggestionAnchors(
            blushArea="under_eye_outer",
            eyelinerArea="outer_third",
            lipArea="natural_lip_boundary",
        ),
    )
