"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@/lib/auth";

import { MessageThread } from "@/components/message-thread";
import { Button } from "@/components/ui/button";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6">
        <Link
          href="/messages"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Messages
        </Link>
      </div>

      <SignedOut>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Sign in to view this conversation.</p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <MessageThread conversationId={params.conversationId} />
      </SignedIn>
    </main>
  );
}
