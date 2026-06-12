"use client";

import Link from "next/link";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMyOffers,
  getMyTasks,
  withdrawOffer,
  type Task,
} from "@/lib/api";
import { formatBudget, formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-accent text-accent-foreground",
  assigned: "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

function Pill({ status }: { status: string }) {
  return (
    <span
      className={
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize " +
        (STATUS_STYLE[status] ?? "bg-muted text-muted-foreground")
      }
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your posted tasks and the offers you&apos;ve made.
          </p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link href="/post">Post a task</Link>
        </Button>
      </div>

      <SignedOut>
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign in to see your tasks and offers.
          </p>
          <SignInButton mode="modal">
            <Button className="mt-4 rounded-full px-6">Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <DashboardContent />
      </SignedIn>
    </main>
  );
}

function DashboardContent() {
  const { getToken } = useAuth();

  const tasks = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => getMyTasks(await getToken()),
  });

  const offers = useQuery({
    queryKey: ["my-offers"],
    queryFn: async () => getMyOffers(await getToken()),
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* My Tasks */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">My Tasks</h2>
          {tasks.data && (
            <span className="text-xs text-muted-foreground">
              {tasks.data.length}
            </span>
          )}
        </div>
        {tasks.isLoading && <Skeleton className="h-16 w-full" />}
        {tasks.data && tasks.data.length === 0 && (
          <EmptyState
            icon="📝"
            text="You haven't posted any tasks yet."
            cta={{ href: "/post", label: "Post a task" }}
          />
        )}
        <div className="space-y-2">
          {tasks.data?.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="block">
              <div className="flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-accent/30">
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.title}</p>
                  <div className="mt-1">
                    <Pill status={task.status} />
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {budgetLabel(task)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* My Jobs & Offers */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">My Jobs &amp; Offers</h2>
          {offers.data && (
            <span className="text-xs text-muted-foreground">
              {offers.data.length}
            </span>
          )}
        </div>
        {offers.isLoading && <Skeleton className="h-16 w-full" />}
        {offers.data && offers.data.length === 0 && (
          <EmptyState
            icon="🤝"
            text="You haven't made any offers yet."
            cta={{ href: "/browse", label: "Browse tasks" }}
          />
        )}
        <div className="space-y-2">
          {offers.data?.map((offer) => (
            <OfferRow key={offer.id} offer={offer} />
          ))}
        </div>
      </section>
    </div>
  );
}

function budgetLabel(task: Task): string {
  return task.agreed_amount != null
    ? formatInr(task.agreed_amount)
    : formatBudget(task.budget_min, task.budget_max);
}

function EmptyState({
  icon,
  text,
  cta,
}: {
  icon: string;
  text: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed py-8 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </div>
  );
}

function OfferRow({
  offer,
}: {
  offer: Awaited<ReturnType<typeof getMyOffers>>[number];
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const withdraw = useMutation({
    mutationFn: async () => withdrawOffer(await getToken(), offer.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-offers"] }),
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
      <div className="min-w-0">
        <Link
          href={`/tasks/${offer.task.id}`}
          className="block truncate font-medium hover:underline"
        >
          {offer.task.title}
        </Link>
        <div className="mt-1">
          <Pill status={offer.status} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold">{formatInr(offer.amount)}</span>
        {offer.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => withdraw.mutate()}
            disabled={withdraw.isPending}
          >
            Withdraw
          </Button>
        )}
      </div>
    </div>
  );
}
