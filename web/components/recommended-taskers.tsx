"use client";

import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  getRecommendedTaskers,
  getTaskInvites,
  sendInvites,
  type Invite,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/star-rating";

const INVITE_STYLE: Record<Invite["status"], string> = {
  pending: "text-amber-700",
  accepted: "text-green-700",
  declined: "text-muted-foreground",
  cancelled: "text-muted-foreground",
};

export function RecommendedTaskers({ taskId }: { taskId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: taskers, isLoading } = useQuery({
    queryKey: ["recommended-taskers", taskId],
    queryFn: async () => getRecommendedTaskers(await getToken(), taskId),
  });

  const { data: invites } = useQuery({
    queryKey: ["task-invites", taskId],
    queryFn: async () => getTaskInvites(await getToken(), taskId),
  });

  const invitedIds = new Set((invites ?? []).map((i) => i.tasker.id));

  const send = useMutation({
    mutationFn: async () =>
      sendInvites(await getToken(), taskId, Array.from(selected)),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["task-invites", taskId] });
    },
  });

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <p className="font-semibold">Recommended taskers near you</p>
        <p className="text-sm text-muted-foreground">
          Pick taskers and send them this task to accept.
        </p>
      </div>

      {isLoading && <p className="text-sm">Finding taskers…</p>}
      {taskers && taskers.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No matching taskers yet. Taskers who add this skill will appear here —
          you can still wait for offers.
        </p>
      )}

      <div className="space-y-2">
        {taskers?.map((t) => {
          const already = invitedIds.has(t.id);
          const isSelected = selected.has(t.id);
          return (
            <div
              key={t.id}
              className={
                "flex items-center gap-3 rounded-xl border p-3 transition-colors " +
                (isSelected ? "border-primary bg-accent/40" : "border-border")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.avatar_url || "https://placehold.co/40x40?text=%20"}
                alt={t.name ?? "Tasker"}
                className="h-10 w-10 rounded-full border object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${t.id}`}
                  className="font-medium hover:underline"
                >
                  {t.name ?? "Tasker"}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {t.rating_count > 0 ? (
                    <span>
                      <Stars value={t.rating_avg} className="text-[10px]" /> (
                      {t.rating_count})
                    </span>
                  ) : (
                    <span>New</span>
                  )}
                  {t.city && <span>· {t.city}</span>}
                  {t.completion_rate > 0 && (
                    <span>· {Math.round(t.completion_rate * 100)}% complete</span>
                  )}
                </div>
              </div>
              {already ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Invited
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  aria-pressed={isSelected}
                  className={
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                    (isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/40")
                  }
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selected.size > 0 && (
        <Button
          onClick={() => send.mutate()}
          disabled={send.isPending}
          className="w-full rounded-full"
        >
          {send.isPending
            ? "Sending…"
            : `Send to ${selected.size} tasker${selected.size > 1 ? "s" : ""}`}
        </Button>
      )}
      {send.isError && (
        <p className="text-sm text-red-600">{(send.error as Error).message}</p>
      )}

      {invites && invites.length > 0 && (
        <div className="border-t pt-3">
          <p className="mb-2 text-sm font-medium">Invites sent</p>
          <ul className="space-y-1 text-sm">
            {invites.map((inv) => (
              <li key={inv.id} className="flex justify-between gap-3">
                <span>{inv.tasker.name ?? "Tasker"}</span>
                <span className={"capitalize " + INVITE_STYLE[inv.status]}>
                  {inv.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
