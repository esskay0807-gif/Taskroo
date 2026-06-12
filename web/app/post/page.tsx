import { SignedIn, SignedOut, SignInButton } from "@/lib/auth";

import { PostTaskWizard } from "@/components/post-task-wizard";
import { Button } from "@/components/ui/button";

const PERKS = [
  { icon: "⚡", t: "Get offers fast", d: "Reviewed taskers respond, often within the hour." },
  { icon: "🔒", t: "Pay securely", d: "Funds are held in escrow and released when you're happy." },
  { icon: "⭐", t: "Trusted taskers", d: "Compare ratings, reviews and completion rates." },
  { icon: "🆓", t: "Free to post", d: "No charge to post a task or receive offers." },
];

export default function PostPage() {
  return (
    <div className="hero-wash">
      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1fr_320px]">
        {/* Wizard */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <SignedIn>
            <PostTaskWizard />
          </SignedIn>
          <SignedOut>
            <div className="space-y-4 py-8 text-center">
              <h1 className="text-2xl font-bold">Post a task</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to post a task and start receiving offers.
              </p>
              <SignInButton mode="modal">
                <Button size="lg" className="rounded-full px-8">
                  Sign in to continue
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>

        {/* Reassurance sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Why post on Taskroo?</h2>
            <ul className="space-y-4">
              {PERKS.map((p) => (
                <li key={p.t} className="flex gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{p.t}</p>
                    <p className="text-xs text-muted-foreground">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
