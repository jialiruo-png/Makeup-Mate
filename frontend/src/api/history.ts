import { request } from "./client";
import type { HistoryItem } from "@/types";

export function listHistory() {
  return request<{ items: HistoryItem[] }>("/history");
}

export function deleteHistory(itemId: string) {
  return request<{ ok: boolean }>(`/history/${itemId}`, { method: "DELETE" });
}
