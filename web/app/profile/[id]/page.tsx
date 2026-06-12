import { notFound } from "next/navigation";

import {
  ApiError,
  getUser,
  getUserReviews,
  type PublicUser,
  type Review,
} from "@/lib/api";
import { ReviewList } from "@/components/review-list";
import { RequestService } from "@/components/request-service";
import { Stars } from "@/components/star-rating";

export const dynamic = "force-dynamic";

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium " +
        (active
          ? "border-green-600 text-green-700"
          : "border-muted text-muted-foreground")
      }
    >
      {active ? "✓ " : ""}
      {label}
    </span>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

async function fetchUser(id: string): Promise<PublicUser | null> {
  try {
    return await getUser(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function fetchReviews(id: string): Promise<Review[]> {
  try {
    return await getUserReviews(id);
  } catch {
    return [];
  }
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [user, reviews] = await Promise.all([
    fetchUser(params.id),
    fetchReviews(params.id),
  ]);
  if (!user) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="hero-wash h-24" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url || "https://placehold.co/96x96?text=%20"}
              alt={user.name ?? "User"}
              className="h-20 w-20 rounded-2xl border-4 border-card bg-muted object-cover"
            />
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {user.name ?? "Unnamed user"}
              </h1>
              {user.city && (
                <p className="text-sm text-muted-foreground">📍 {user.city}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {user.is_tasker && (
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium " +
                  (user.is_available
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground")
                }
              >
                {user.is_available ? "● Available" : "Unavailable"}
              </span>
            )}
            {user.is_poster && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                Poster
              </span>
            )}
            {user.is_tasker && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                Tasker
              </span>
            )}
          </div>

          {user.bio && <p className="mt-4 text-sm">{user.bio}</p>}

          {/* Trust stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border bg-secondary/30 p-4">
            <Stat
              value={
                user.rating_count > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    {user.rating_avg.toFixed(1)}
                    <Stars value={user.rating_avg} className="text-xs" />
                  </span>
                ) : (
                  "—"
                )
              }
              label="Rating"
            />
            <Stat value={user.rating_count} label="Reviews" />
            <Stat
              value={
                user.rating_count > 0
                  ? `${Math.round(user.completion_rate * 100)}%`
                  : "—"
              }
              label="Completion"
            />
          </div>

          {/* Skills */}
          {user.is_tasker && user.categories.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {user.categories.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services for hire */}
          {user.services.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Services</p>
              <div className="space-y-2">
                {user.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.category.name}
                      </p>
                      {s.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <RequestService service={s} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Verification</p>
            <div className="flex flex-wrap gap-2">
              <Badge label="Phone verified" active={user.phone_verified} />
              <Badge label="ID verified" active={user.id_verified} />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">
          Reviews{reviews.length > 0 && ` (${reviews.length})`}
        </h2>
        <ReviewList reviews={reviews} />
      </section>
    </main>
  );
}
