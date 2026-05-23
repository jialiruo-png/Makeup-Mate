import { request } from "./client";
import type { MediaAsset, MediaPurpose, RetentionPolicy } from "@/types";

export interface UploadMediaArgs {
  file: File;
  purpose: MediaPurpose;
  sessionId?: string | null;
  retentionPolicy?: RetentionPolicy;
}

export function uploadMedia({ file, purpose, sessionId, retentionPolicy }: UploadMediaArgs) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("purpose", purpose);
  if (sessionId) fd.append("sessionId", sessionId);
  if (retentionPolicy) fd.append("retentionPolicy", retentionPolicy);
  return request<MediaAsset>("/media/upload", {
    method: "POST",
    body: fd,
  });
}
