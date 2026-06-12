import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getTask, type Task } from "@/lib/api";
import { formatBudget } from "@/lib/format";
import { TaskInteractions } from "@/components/task-interactions";
import { TaskReviews } from "@/components/task-reviews";
import { Stars } from "@/components/star-rating";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Task["status"], string> = {
  draft: "Draft",
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<Task["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-accent text-accent-foreground",
  assigned: "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
};

async function fetchTask(id: string): Promise<Task | null> {
  try {
    return await getTask(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const task = await fetchTask(params.id);
  if (!task) notFound();

  const location =
    task.location_type === "remote"
      ? "Remote"
      : [task.city, task.address].filter(Boolean).join(", ") || "In person";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/browse"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Back to browse
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                {task.category.name}
              </span>
              <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                📍 {location}
              </span>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium " +
                  STATUS_STYLE[task.status]
                }
              >
                {STATUS_LABEL[task.status]}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {task.title}
            </h1>

            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground/90">
              {task.description}
            </p>

            {task.photos.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {task.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt="Task photo"
                    className="h-32 w-32 rounded-xl border object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <TaskInteractions
            taskId={task.id}
            posterId={task.poster.id}
            assignedTaskerId={task.assigned_tasker_id}
            agreedAmount={task.agreed_amount}
            status={task.status}
          />

          <TaskReviews
            taskId={task.id}
            posterId={task.poster.id}
            assignedTaskerId={task.assigned_tasker_id}
            status={task.status}
          />
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Budget
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {formatBudget(task.budget_min, task.budget_max)}
            </p>

            <div className="mt-6 flex items-center gap-3 border-t pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.poster.avatar_url || "https://placehold.co/44x44?text=%20"}
                alt={task.poster.name ?? "Poster"}
                className="h-11 w-11 rounded-full border object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Posted by</p>
                <Link
                  href={`/profile/${task.poster.id}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {task.poster.name ?? "View profile"}
                </Link>
                {task.poster.rating_count > 0 && (
                  <Stars
                    value={task.poster.rating_avg}
                    className="text-[11px]"
                  />
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
