import { request } from "./client";
import type { Inspiration, InspirationType, MakeupCard } from "@/types";

export type ListInspirationsQuery = {
  type?: InspirationType;
  style?: string;
  scene?: string;
  difficulty?: string;
};

export function listInspirations(query: ListInspirationsQuery = {}) {
  return request<{ items: Inspiration[] }>("/inspirations", { query });
}

export interface GenerateMyVersionRequest {
  sessionId?: string | null;
  useProfile?: boolean;
  useShortTermContext?: boolean;
}

export interface GenerateMyVersionResponse {
  card: MakeupCard;
  personalizedAdjustments: Array<{
    original: string;
    mine: string;
    reason: string;
  }>;
}

export function generateMyVersion(
  inspirationId: string,
  payload: GenerateMyVersionRequest,
) {
  return request<GenerateMyVersionResponse>(
    `/inspirations/${inspirationId}/generate-my-version`,
    { method: "POST", body: payload },
  );
}
