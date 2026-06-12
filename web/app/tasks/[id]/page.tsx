import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getTask, type Task } from "@/lib/api";
import { formatBudget, formatInr } from "@/lib/format";
import { TaskInteractions } from "@/components/task-interactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Task["status"], string> = {
  draft: "Draft",
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6">
        <Link href="/browse" className="text-sm text-muted-foreground hover:underline">
          ← Browse
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-0.5">
                  {task.category.name}
                </span>
                <span className="rounded-full border px-2 py-0.5">{location}</span>
                <span className="rounded-full border px-2 py-0.5">
                  {STATUS_LABEL[task.status]}
                </span>
              </div>
            </div>
            <p className="shrink-0 text-lg font-semibold">
              {formatBudget(task.budget_min, task.budget_max)}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="whitespace-pre-wrap text-sm">{task.description}</p>

          {task.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Task photo"
                  className="h-28 w-28 rounded border object-cover"
                />
              ))}
            </div>
          )}

          {task.status === "assigned" && task.agreed_amount != null && (
            <p className="rounded-lg border border-green-600 bg-green-50 p-3 text-sm text-green-800">
              Assigned · agreed at {formatInr(task.agreed_amount)}
            </p>
          )}

          <div className="flex items-center gap-3 border-t pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.poster.avatar_url || "https://placehold.co/40x40?text=?"}
              alt={task.poster.name ?? "Poster"}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <div className="text-sm">
              <p className="text-muted-foreground">Posted by</p>
              <Link
                href={`/profile/${task.poster.id}`}
                className="font-medium hover:underline"
              >
                {task.poster.name ?? "View profile"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <TaskInteractions
          taskId={task.id}
          posterId={task.poster.id}
          status={task.status}
        />
      </div>
    </main>
  );
}
