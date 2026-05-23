import type { UserPublic } from "@/types";

const TOKEN_KEY = "mm.token";
const USER_KEY = "mm.user";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* localStorage 不可用就算了，下次刷新会掉登录 */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* noop */
  }
}

export function getCachedUser(): UserPublic | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserPublic) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: UserPublic): void {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* noop */
  }
}
