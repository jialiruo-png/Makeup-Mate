import { clearToken, getToken } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export const UNAUTHORIZED_EVENT = "mm:unauthorized";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | undefined | null;
type Query = Record<string, QueryValue>;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Query;
};

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = opts;
  const isForm = body instanceof FormData;
  const token = getToken();
  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body == null ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") ?? "";
  const parsed = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      try {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      } catch {
        /* noop */
      }
    }
    throw new ApiError(res.status, `API ${res.status} ${path}`, parsed);
  }
  return parsed as T;
}

export const apiBase = API_BASE;
