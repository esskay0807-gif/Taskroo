"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@/lib/auth";

import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            T
          </span>
          <span className="text-lg font-bold tracking-tight">
            Task<span className="text-primary">Market</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/browse"
            className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Browse
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
