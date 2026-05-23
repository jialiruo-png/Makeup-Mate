import { request } from "./client";
import type { TokenResponse, UserPublic } from "@/types";

export function register(username: string, password: string) {
  return request<TokenResponse>("/auth/register", {
    method: "POST",
    body: { username, password },
  });
}

export function login(username: string, password: string) {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function fetchMe() {
  return request<UserPublic>("/auth/me");
}
