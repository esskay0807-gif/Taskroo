"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">
          TaskMarket
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/browse" className="rounded-md px-2 py-1 hover:bg-muted">
            Browse
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-md px-2 py-1 hover:bg-muted"
            >
              Dashboard
            </Link>
            <Link
              href="/messages"
              className="rounded-md px-2 py-1 hover:bg-muted"
            >
              Messages
            </Link>
            <NotificationBell />
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
