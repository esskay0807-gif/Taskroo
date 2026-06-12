"use client";

import { useAuth, SignedIn, SignedOut, SignInButton } from "@/lib/auth";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { getConversations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat with posters and taskers about a task.
        </p>
      </div>

      <SignedOut>
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign in to see your messages.
          </p>
          <SignInButton mode="modal">
            <Button className="mt-4 rounded-full px-6">Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <ConversationList />
      </SignedIn>
    </main>
  );
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ConversationList() {
  const { getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => getConversations(await getToken()),
    refetchInterval: 4000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
        <div className="text-2xl">💬</div>
        <p className="mt-2 text-sm text-muted-foreground">
          No conversations yet. They start when a tasker makes an offer.
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link href="/browse">Browse tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-2xl border bg-card shadow-sm">
      {data.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-4 p-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-accent/40"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {conv.other_user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conv.other_user.avatar_url}
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              initials(conv.other_user.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium">
                {conv.other_user.name ?? "A user"}
              </p>
              {conv.unread_count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {conv.unread_count}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {conv.task.title}
            </p>
            <p
              className={
                "mt-0.5 truncate text-sm " +
                (conv.unread_count > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground")
              }
            >
              {conv.last_message?.body ?? "No messages yet"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
