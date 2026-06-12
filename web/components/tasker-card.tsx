import Link from "next/link";

import type { TaskerDirectoryItem } from "@/lib/api";
import { Stars } from "@/components/star-rating";
import { RequestService } from "@/components/request-service";

export function TaskerCard({ tasker }: { tasker: TaskerDirectoryItem }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tasker.avatar_url || "https://placehold.co/48x48?text=%20"}
          alt={tasker.name ?? "Tasker"}
          className="h-12 w-12 rounded-full border object-cover"
        />
        <div className="min-w-0">
          <Link
            href={`/profile/${tasker.id}`}
            className="font-semibold hover:underline"
          >
            {tasker.name ?? "Tasker"}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {tasker.rating_count > 0 ? (
              <span>
                <Stars value={tasker.rating_avg} className="text-[10px]" /> (
                {tasker.rating_count})
              </span>
            ) : (
              <span>New</span>
            )}
            {tasker.city && <span>· 📍 {tasker.city}</span>}
            {tasker.completion_rate > 0 && (
              <span>· {Math.round(tasker.completion_rate * 100)}% complete</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t pt-4">
        {tasker.services.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-xl border p-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.category.name}</p>
              {s.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
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
  );
}
