import { request } from "./client";

export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
}

export function getHealth() {
  return request<HealthResponse>("/health");
}
