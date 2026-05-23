from pydantic import BaseModel, ConfigDict


class CamelModel(BaseModel):
    """前端使用 camelCase，所以这里统一允许 alias 和 from_attributes。"""

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class OkResponse(CamelModel):
    ok: bool = True


class HealthResponse(CamelModel):
    ok: bool
    service: str
    version: str
