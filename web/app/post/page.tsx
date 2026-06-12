import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@/lib/auth";

import { PostTaskWizard } from "@/components/post-task-wizard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PostPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/browse" className="text-sm text-muted-foreground hover:underline">
          ← Browse
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Post a task</CardTitle>
          <CardDescription>
            Tell us what you need done and your budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignedIn>
            <PostTaskWizard />
          </SignedIn>
          <SignedOut>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Sign in to post a task.</p>
              <SignInButton mode="modal">
                <Button>Sign in</Button>
              </SignInButton>
            </div>
          </SignedOut>
        </CardContent>
      </Card>
    </main>
  );
}
