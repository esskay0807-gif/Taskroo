import Link from "next/link";

import type { Task } from "@/lib/api";
import { formatBudget } from "@/lib/format";
import { Stars } from "@/components/star-rating";

export function TaskCard({ task }: { task: Task }) {
  const location =
    task.location_type === "remote" ? "Remote" : task.city ?? "In person";

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold group-hover:text-primary">
              {task.title}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-foreground">
              {formatBudget(task.budget_min, task.budget_max)}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Budget
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
              {task.category.name}
            </span>
            <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
              📍 {location}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                task.poster.avatar_url || "https://placehold.co/28x28?text=%20"
              }
              alt={task.poster.name ?? "Poster"}
              className="h-7 w-7 rounded-full border object-cover"
            />
            <div className="text-right">
              <p className="text-xs font-medium leading-tight">
                {task.poster.name ?? "Someone"}
              </p>
              {task.poster.rating_count > 0 && (
                <Stars
                  value={task.poster.rating_avg}
                  className="text-[9px] leading-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
