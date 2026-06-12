"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@/lib/auth";

import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="Taskroo home">
          <Logo className="h-8 text-foreground" />
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/taskers"
            className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Find taskers
          </Link>
          <Link
            href="/browse"
            className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Browse tasks
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/messages"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Messages
            </Link>
            <NotificationBell />
          </SignedIn>
          <Button asChild size="sm" className="ml-1 rounded-full px-4">
            <Link href="/post">Post a task</Link>
          </Button>
          <SignedIn>
            <span className="ml-1">
              <UserButton />
            </span>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="ghost" className="ml-1 rounded-full">
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
