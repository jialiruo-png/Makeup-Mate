import { request } from "./client";
import type { ChatMessage, ChatSession, MessageType } from "@/types";

export interface CreateSessionRequest {
  cardId?: string | null;
  inspirationId?: string | null;
  mode?: "text_companion" | "voice_companion";
}

export function createSession(payload: CreateSessionRequest) {
  return request<ChatSession>("/chat/sessions", {
    method: "POST",
    body: payload,
  });
}

export function getMessages(sessionId: string) {
  return request<{ messages: ChatMessage[]; currentStep: string }>(
    `/chat/sessions/${sessionId}/messages`,
  );
}

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  quickAction?: string | null;
  mediaAssetId?: string | null;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  currentStep: string;
}

export function sendMessage(sessionId: string, payload: SendMessageRequest) {
  return request<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: payload,
  });
}
