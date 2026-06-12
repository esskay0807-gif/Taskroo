import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { MeCard } from "@/components/me-card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">TaskMarket</h1>
        <p className="mt-2 text-muted-foreground">
          Post a task → offers → hire → chat → pay → review.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/browse">Browse tasks</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/post">Post a task</Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">Sign up</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <MeCard />
    </main>
  );
}
