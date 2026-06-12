import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getUser, type PublicUser } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
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

async function fetchUser(id: string): Promise<PublicUser | null> {
  try {
    return await getUser(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await fetchUser(params.id);
  if (!user) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url || "https://placehold.co/80x80?text=?"}
              alt={user.name ?? "User"}
              className="h-20 w-20 rounded-full border object-cover"
            />
            <div>
              <CardTitle className="text-xl">
                {user.name ?? "Unnamed user"}
              </CardTitle>
              {user.city && (
                <p className="text-sm text-muted-foreground">{user.city}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {user.is_poster && <Badge label="Poster" active />}
                {user.is_tasker && <Badge label="Tasker" active />}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {user.bio && <p className="text-sm">{user.bio}</p>}

          {/* Trust signals — placeholders until M6 computes real ratings. */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold">
                {user.rating_count > 0 ? user.rating_avg.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{user.rating_count}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {user.rating_count > 0
                  ? `${Math.round(user.completion_rate * 100)}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge label="Phone verified" active={user.phone_verified} />
              <Badge label="ID verified" active={user.id_verified} />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
