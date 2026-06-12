"use client";

import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  getNotifications,
  markNotificationRead,
  type Notification,
} from "@/lib/api";

function describe(n: Notification): string {
  const title = (n.payload.task_title as string) ?? "your task";
  switch (n.type) {
    case "offer_received":
      return `New offer on “${title}” (₹${n.payload.amount})`;
    case "offer_accepted":
      return `Your offer on “${title}” was accepted`;
    case "new_message":
      return `New message about “${title}”`;
    case "task_completed":
      return `“${title}” was completed`;
    default:
      return "Notification";
  }
}

function targetHref(n: Notification): string {
  if (n.type === "new_message" && n.payload.conversation_id) {
    return `/messages/${n.payload.conversation_id}`;
  }
  if (n.payload.task_id) return `/tasks/${n.payload.task_id}`;
  return "/dashboard";
}

export function NotificationBell() {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => getNotifications(await getToken()),
    refetchInterval: 10000,
  });

  const read = useMutation({
    mutationFn: async (id: string) => markNotificationRead(await getToken(), id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unread_count ?? 0;

  function handleClick(n: Notification) {
    if (!n.read_at) read.mutate(n.id);
    setOpen(false);
    router.push(targetHref(n));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 hover:bg-muted"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="border-b px-4 py-2 text-sm font-medium">
            Notifications
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {(!data || data.items.length === 0) && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </li>
            )}
            {data?.items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={
                    "block w-full px-4 py-3 text-left text-sm hover:bg-muted " +
                    (n.read_at ? "text-muted-foreground" : "font-medium")
                  }
                >
                  {describe(n)}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
