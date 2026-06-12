"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@/lib/auth";

import { MessageThread } from "@/components/message-thread";
import { Button } from "@/components/ui/button";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/messages"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Messages
      </Link>

      <div className="mt-4">
        <SignedOut>
          <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Sign in to view this conversation.
            </p>
            <SignInButton mode="modal">
              <Button className="mt-4 rounded-full px-6">Sign in</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <MessageThread conversationId={params.conversationId} />
        </SignedIn>
      </div>
    </main>
  );
}
