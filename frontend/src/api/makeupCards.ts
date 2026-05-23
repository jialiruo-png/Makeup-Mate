import { request } from "./client";
import type { AnalyzeResponse, MakeupCard, SourceType } from "@/types";

export interface AnalyzeRequest {
  sourceType: SourceType;
  sourceUrl?: string | null;
  mediaAssetId?: string | null;
}

export function analyzeMakeup(payload: AnalyzeRequest) {
  return request<AnalyzeResponse>("/makeup-cards/analyze", {
    method: "POST",
    body: payload,
  });
}

export function getMakeupCard(cardId: string) {
  return request<MakeupCard>(`/makeup-cards/${cardId}`);
}

export interface ShareResponse {
  shareUrl: string;
  shareText: string;
  imageUrl?: string | null;
}

export function shareMakeupCard(cardId: string) {
  return request<ShareResponse>(`/makeup-cards/${cardId}/share`, {
    method: "POST",
  });
}
