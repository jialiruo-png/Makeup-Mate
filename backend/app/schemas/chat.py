from datetime import datetime
from typing import Literal, Any
from pydantic import Field
from .common import CamelModel


ChatMode = Literal["text_companion", "voice_companion"]
MessageRole = Literal["user", "assistant", "system"]
MessageType = Literal["text", "image", "step_card", "card_summary"]


class ChatMessage(CamelModel):
    message_id: str = Field(alias="messageId")
    role: MessageRole
    content: str
    message_type: MessageType = Field(default="text", alias="messageType")
    metadata: dict[str, Any] = {}
    created_at: datetime | None = Field(default=None, alias="createdAt")


class ChatSession(CamelModel):
    session_id: str = Field(alias="sessionId")
    card_id: str | None = Field(default=None, alias="cardId")
    inspiration_id: str | None = Field(default=None, alias="inspirationId")
    mode: ChatMode
    current_step: str = Field(alias="currentStep")
    messages: list[ChatMessage] = []


class CreateSessionRequest(CamelModel):
    card_id: str | None = Field(default=None, alias="cardId")
    inspiration_id: str | None = Field(default=None, alias="inspirationId")
    mode: ChatMode = "text_companion"


class SendMessageRequest(CamelModel):
    content: str = ""
    message_type: MessageType = Field(default="text", alias="messageType")
    quick_action: str | None = Field(default=None, alias="quickAction")
    media_asset_id: str | None = Field(default=None, alias="mediaAssetId")


class SendMessageResponse(CamelModel):
    user_message: ChatMessage = Field(alias="userMessage")
    assistant_message: ChatMessage = Field(alias="assistantMessage")
    current_step: str = Field(alias="currentStep")


class ListMessagesResponse(CamelModel):
    messages: list[ChatMessage]
    current_step: str = Field(alias="currentStep")
