import { SignedIn, SignedOut, SignInButton } from "@/lib/auth";

import { ProfileForm } from "@/components/profile-form";
import { ServicesManager } from "@/components/services-manager";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit your profile and choose how you use Taskroo.
        </p>
      </div>

      <SignedIn>
        <div className="space-y-6">
          <ProfileForm />
          <ServicesManager />
        </div>
      </SignedIn>
      <SignedOut>
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign in to edit your profile.
          </p>
          <SignInButton mode="modal">
            <Button className="mt-4 rounded-full px-6">Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>
    </main>
  );
}
