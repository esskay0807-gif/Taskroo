"use client";

import Link from "next/link";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyOffers, getMyTasks, withdrawOffer } from "@/lib/api";
import { formatBudget, formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/messages" className="hover:underline">
            Messages
          </Link>
          <Link href="/post" className="hover:underline">
            Post a task →
          </Link>
        </div>
      </div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

      <SignedOut>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Sign in to see your tasks and offers.</p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
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
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">My Tasks</h2>
        {tasks.isLoading && <p className="text-sm">Loading…</p>}
        {tasks.data && tasks.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t posted any tasks yet.{" "}
            <Link href="/post" className="underline">
              Post one
            </Link>
            .
          </p>
        )}
        <div className="space-y-2">
          {tasks.data?.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {task.status}
                    </span>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {task.agreed_amount != null
                      ? formatInr(task.agreed_amount)
                      : formatBudget(task.budget_min, task.budget_max)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">My Jobs &amp; Offers</h2>
        {offers.isLoading && <p className="text-sm">Loading…</p>}
        {offers.data && offers.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t made any offers yet.{" "}
            <Link href="/browse" className="underline">
              Browse tasks
            </Link>
            .
          </p>
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
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <Link
            href={`/tasks/${offer.task.id}`}
            className="truncate font-medium hover:underline"
          >
            {offer.task.title}
          </Link>
          <p className="text-xs text-muted-foreground">{offer.status}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold">
            {formatInr(offer.amount)}
          </span>
          {offer.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => withdraw.mutate()}
              disabled={withdraw.isPending}
            >
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
