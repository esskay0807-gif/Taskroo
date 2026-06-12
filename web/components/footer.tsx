import Link from "next/link";

import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Logo className="h-7 text-foreground" />
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/post" className="hover:text-foreground">
            Post a task
          </Link>
          <Link href="/browse" className="hover:text-foreground">
            Browse tasks
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Taskroo
        </p>
      </div>
    </footer>
  );
}
