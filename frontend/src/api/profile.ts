import { request } from "./client";
import type { AnalyzePhotoResponse, BeautyProfile } from "@/types";

export interface AnalyzePhotoRequest {
  mediaAssetId: string;
  sessionId?: string | null;
  saveToProfile?: boolean;
}

export function analyzePhoto(payload: AnalyzePhotoRequest) {
  return request<AnalyzePhotoResponse>("/profile/analyze-photo", {
    method: "POST",
    body: payload,
  });
}

export interface MeResponse {
  userId: string;
  nickname: string;
  avatarUrl?: string | null;
  profileCompleteness: number;
  beautyProfile?: BeautyProfile | null;
  privacy: {
    saveProfileEnabled: boolean;
    memoryEnabled: boolean;
    saveRawPhoto: boolean;
  };
}

export function getMe() {
  return request<MeResponse>("/profile/me");
}

export function updateMe(payload: Partial<MeResponse>) {
  return request<MeResponse>("/profile/me", {
    method: "PATCH",
    body: payload,
  });
}

export function clearMemory() {
  return request<{ ok: boolean }>("/profile/me/memory", {
    method: "DELETE",
  });
}
