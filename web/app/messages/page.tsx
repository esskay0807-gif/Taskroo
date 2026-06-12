"use client";

import Link from "next/link";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

import { getConversations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
      </div>
      <h1 className="mb-8 text-2xl font-bold">Messages</h1>

      <SignedOut>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Sign in to see your messages.</p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <ConversationList />
      </SignedIn>
    </main>
  );
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
      <p className="text-sm text-muted-foreground">
        No conversations yet. They start when a tasker makes an offer.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((conv) => (
        <Link key={conv.id} href={`/messages/${conv.id}`} className="block">
          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {conv.other_user.name ?? "A user"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {conv.task.title}
                  </span>
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {conv.last_message?.body ?? "No messages yet"}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  {conv.unread_count}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
