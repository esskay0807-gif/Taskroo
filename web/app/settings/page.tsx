import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile settings</CardTitle>
          <CardDescription>
            Edit your public profile and choose how you use TaskMarket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignedIn>
            <ProfileForm />
          </SignedIn>
          <SignedOut>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Sign in to edit your profile.</p>
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
