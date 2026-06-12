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
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_poster: boolean;
  is_tasker: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  rating_avg: number;
  rating_count: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_poster: boolean;
  is_tasker: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  rating_avg: number;
  rating_count: number;
  completion_rate: number;
  created_at: string;
}

export interface ProfileUpdate {
  name?: string | null;
  bio?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_poster?: boolean;
  is_tasker?: boolean;
}

export interface PresignResponse {
  upload_url: string;
  public_url: string;
  key: string;
  method: string;
  headers: Record<string, string>;
}

export function getMe(token: string | null): Promise<Me> {
  return apiFetch<Me>("/v1/me", { token });
}

export function updateMe(
  token: string | null,
  payload: ProfileUpdate,
): Promise<Me> {
  return apiFetch<Me>("/v1/me", {
    token,
    init: { method: "PATCH", body: JSON.stringify(payload) },
  });
}

export function getUser(id: string): Promise<PublicUser> {
  return apiFetch<PublicUser>(`/v1/users/${id}`);
}

export type UploadKind = "avatar" | "task";

export function presignUpload(
  token: string | null,
  body: { filename: string; content_type: string; kind: UploadKind },
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>("/v1/uploads/presign", {
    token,
    init: { method: "POST", body: JSON.stringify(body) },
  });
}

/** Upload a file to a presigned URL, then return the public URL to store. */
export async function uploadFile(
  token: string | null,
  file: File,
  kind: UploadKind,
): Promise<string> {
  const presigned = await presignUpload(token, {
    filename: file.name,
    content_type: file.type || "application/octet-stream",
    kind,
  });
  const res = await fetch(presigned.upload_url, {
    method: presigned.method,
    headers: presigned.headers,
    body: file,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Upload failed (${res.status})`);
  }
  return presigned.public_url;
}

export function uploadAvatar(token: string | null, file: File): Promise<string> {
  return uploadFile(token, file, "avatar");
}

// --- Tasks & categories ---

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface TaskPhoto {
  id: string;
  url: string;
  sort_order: number;
}

export interface Poster {
  id: string;
  name: string | null;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
}

export type TaskStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type LocationType = "in_person" | "remote";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  location_type: LocationType;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  budget_min: number;
  budget_max: number;
  currency: string;
  category: Category;
  poster: Poster;
  photos: TaskPhoto[];
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskCreateInput {
  title: string;
  description: string;
  category_id: string;
  location_type: LocationType;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  budget_min: number;
  budget_max: number;
  photo_urls?: string[];
}

export interface TaskFilters {
  category?: string;
  location_type?: LocationType | "";
  city?: string;
  budget_min?: number | "";
  budget_max?: number | "";
  q?: string;
  sort?: "newest" | "budget_asc" | "budget_desc";
  limit?: number;
  offset?: number;
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/v1/categories");
}

export function createTask(
  token: string | null,
  input: TaskCreateInput,
): Promise<Task> {
  return apiFetch<Task>("/v1/tasks", {
    token,
    init: { method: "POST", body: JSON.stringify(input) },
  });
}

export function listTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return apiFetch<TaskListResponse>(`/v1/tasks${qs ? `?${qs}` : ""}`);
}

export function getTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/v1/tasks/${id}`);
}
