import Link from "next/link";

import type { Task } from "@/lib/api";
import { formatBudget } from "@/lib/format";
import { Stars } from "@/components/star-rating";
import { Card, CardContent } from "@/components/ui/card";

export function TaskCard({ task }: { task: Task }) {
  const location =
    task.location_type === "remote" ? "Remote" : task.city ?? "In person";

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{task.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">
                {task.category.name}
              </span>
              <span className="rounded-full border px-2 py-0.5">{location}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold">
              {formatBudget(task.budget_min, task.budget_max)}
            </p>
            <p className="text-xs text-muted-foreground">
              {task.poster.name ?? "Someone"}
            </p>
            {task.poster.rating_count > 0 && (
              <p className="text-xs">
                <Stars value={task.poster.rating_avg} className="text-[10px]" />{" "}
                <span className="text-muted-foreground">
                  ({task.poster.rating_count})
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
