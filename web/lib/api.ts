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

export type UploadKind = "avatar" | "task" | "review";

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
  assigned_tasker_id: string | null;
  agreed_amount: number | null;
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

// --- Offers ---

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Offer {
  id: string;
  task_id: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  tasker: Poster;
  created_at: string;
}

export interface MyOffer extends Offer {
  task: Task;
}

export interface OfferCreateInput {
  amount: number;
  message?: string | null;
}

export function createOffer(
  token: string | null,
  taskId: string,
  input: OfferCreateInput,
): Promise<Offer> {
  return apiFetch<Offer>(`/v1/tasks/${taskId}/offers`, {
    token,
    init: { method: "POST", body: JSON.stringify(input) },
  });
}

export function getTaskOffers(
  token: string | null,
  taskId: string,
): Promise<Offer[]> {
  return apiFetch<Offer[]>(`/v1/tasks/${taskId}/offers`, { token });
}

export function acceptOffer(
  token: string | null,
  offerId: string,
): Promise<Offer> {
  return apiFetch<Offer>(`/v1/offers/${offerId}/accept`, {
    token,
    init: { method: "POST" },
  });
}

export function withdrawOffer(
  token: string | null,
  offerId: string,
): Promise<Offer> {
  return apiFetch<Offer>(`/v1/offers/${offerId}/withdraw`, {
    token,
    init: { method: "POST" },
  });
}

export function getMyTasks(token: string | null): Promise<Task[]> {
  return apiFetch<Task[]>("/v1/me/tasks", { token });
}

export function getMyOffers(token: string | null): Promise<MyOffer[]> {
  return apiFetch<MyOffer[]>("/v1/me/offers", { token });
}

// --- Messaging ---

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationTaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Conversation {
  id: string;
  task: ConversationTaskSummary;
  other_user: Poster;
  last_message: Message | null;
  unread_count: number;
}

export function getConversations(token: string | null): Promise<Conversation[]> {
  return apiFetch<Conversation[]>("/v1/conversations", { token });
}

export function getMessages(
  token: string | null,
  conversationId: string,
): Promise<Message[]> {
  return apiFetch<Message[]>(`/v1/conversations/${conversationId}/messages`, {
    token,
  });
}

export function sendMessage(
  token: string | null,
  conversationId: string,
  body: string,
): Promise<Message> {
  return apiFetch<Message>(`/v1/conversations/${conversationId}/messages`, {
    token,
    init: { method: "POST", body: JSON.stringify({ body }) },
  });
}

// --- Payments ---

export type PaymentStatus =
  | "authorized"
  | "held"
  | "released"
  | "refunded"
  | "failed";

export interface Payment {
  id: string;
  task_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  fee_amount: number | null;
  net_amount: number | null;
  service_fee_percent: number;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResponse {
  payment: Payment;
  key_id: string | null;
  order_id: string | null;
  amount_paise: number;
  currency: string;
  dev: boolean;
}

export interface VerifyInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function getTaskPayment(
  token: string | null,
  taskId: string,
): Promise<Payment> {
  return apiFetch<Payment>(`/v1/tasks/${taskId}/payment`, { token });
}

export function checkout(
  token: string | null,
  taskId: string,
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/v1/payments/checkout", {
    token,
    init: { method: "POST", body: JSON.stringify({ task_id: taskId }) },
  });
}

export function verifyPayment(
  token: string | null,
  body: VerifyInput,
): Promise<Payment> {
  return apiFetch<Payment>("/v1/payments/verify", {
    token,
    init: { method: "POST", body: JSON.stringify(body) },
  });
}

export function completeTask(
  token: string | null,
  taskId: string,
): Promise<Task> {
  return apiFetch<Task>(`/v1/tasks/${taskId}/complete`, {
    token,
    init: { method: "POST" },
  });
}

// --- Reviews ---

export type ReviewRole = "of_tasker" | "of_poster";

export interface ReviewPhoto {
  id: string;
  url: string;
  sort_order: number;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer: Poster;
  reviewee_id: string;
  role: ReviewRole;
  rating: number;
  comment: string | null;
  photos: ReviewPhoto[];
  created_at: string;
}

export interface ReviewCreateInput {
  rating: number;
  comment?: string | null;
  photo_urls?: string[];
}

export function createReview(
  token: string | null,
  taskId: string,
  input: ReviewCreateInput,
): Promise<Review> {
  return apiFetch<Review>(`/v1/tasks/${taskId}/reviews`, {
    token,
    init: { method: "POST", body: JSON.stringify(input) },
  });
}

export function getUserReviews(userId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/v1/users/${userId}/reviews`);
}

export function getTaskReviews(taskId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/v1/tasks/${taskId}/reviews`);
}

// --- Notifications ---

export type NotificationType =
  | "offer_received"
  | "offer_accepted"
  | "new_message"
  | "task_completed";

export interface Notification {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unread_count: number;
}

export function getNotifications(
  token: string | null,
): Promise<NotificationListResponse> {
  return apiFetch<NotificationListResponse>("/v1/notifications", { token });
}

export function markNotificationRead(
  token: string | null,
  id: string,
): Promise<Notification> {
  return apiFetch<Notification>(`/v1/notifications/${id}/read`, {
    token,
    init: { method: "POST" },
  });
}
