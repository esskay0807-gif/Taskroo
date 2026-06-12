/**
 * Typed API client for the TaskMarket FastAPI backend.
 *
 * All calls go through `apiFetch`. Pass a Clerk token to authenticate; the
 * backend verifies it (or, in local dev with DEV_AUTH_BYPASS, ignores it).
 * No raw fetch() calls should live in components — add typed helpers here.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: { token?: string | null; init?: RequestInit } = {},
): Promise<T> {
  const { token, init } = options;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

// --- Typed resource shapes & helpers ---

export interface Me {
  id: string;
  clerk_id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export function getMe(token: string | null): Promise<Me> {
  return apiFetch<Me>("/v1/me", { token });
}
