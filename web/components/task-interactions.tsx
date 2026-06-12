"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  acceptOffer,
  createOffer,
  getMe,
  getTaskOffers,
  type Offer,
  type TaskStatus,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import { PaymentPanel } from "@/components/payment-panel";
import { Stars } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_STYLES: Record<Offer["status"], string> = {
  pending: "text-amber-700 border-amber-600",
  accepted: "text-green-700 border-green-600",
  rejected: "text-muted-foreground border-muted",
  withdrawn: "text-muted-foreground border-muted",
};

export function TaskInteractions({
  taskId,
  posterId,
  assignedTaskerId,
  agreedAmount,
  status,
}: {
  taskId: string;
  posterId: string;
  assignedTaskerId: string | null;
  agreedAmount: number | null;
  status: TaskStatus;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data: me } = useQuery({
    queryKey: ["me"],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => getMe(await getToken()),
  });

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border p-4 text-sm">
        <p className="mb-3 text-muted-foreground">Sign in to make an offer.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  if (!me) return null;

  const isPoster = me.id === posterId;
  const isAssignedTasker = assignedTaskerId != null && me.id === assignedTaskerId;
  // Payment is relevant once a task is assigned (or completed) and an amount agreed.
  const showPayment =
    (status === "assigned" || status === "completed") && agreedAmount != null;

  if (isPoster) {
    return (
      <div className="space-y-6">
        {showPayment && (
          <PaymentPanel
            taskId={taskId}
            agreedAmount={agreedAmount!}
            isPoster
          />
        )}
        <OffersList taskId={taskId} taskStatus={status} />
      </div>
    );
  }

  if (isAssignedTasker && showPayment) {
    return (
      <PaymentPanel
        taskId={taskId}
        agreedAmount={agreedAmount!}
        isPoster={false}
      />
    );
  }

  if (status !== "open") {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        This task is no longer open for offers.
      </p>
    );
  }

  return <MakeOfferPanel taskId={taskId} />;
}

function MakeOfferPanel({ taskId }: { taskId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      createOffer(await getToken(), taskId, {
        amount: Number(amount),
        message: message.trim() || null,
      }),
    onSuccess: () => {
      setAmount("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
    },
  });

  const valid = amount !== "" && Number(amount) > 0;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="font-medium">Make an offer</p>
      <div className="space-y-2">
        <Label htmlFor="amount">Your price (₹)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the poster why you're a good fit"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!valid || mutation.isPending}
        >
          {mutation.isPending ? "Sending…" : "Send offer"}
        </Button>
        {mutation.isSuccess && (
          <span className="text-sm text-green-600">Offer sent.</span>
        )}
        {mutation.isError && (
          <span className="text-sm text-red-600">
            {(mutation.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}

function OffersList({
  taskId,
  taskStatus,
}: {
  taskId: string;
  taskStatus: TaskStatus;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["task-offers", taskId],
    queryFn: async () => getTaskOffers(await getToken(), taskId),
  });

  const accept = useMutation({
    mutationFn: async (offerId: string) =>
      acceptOffer(await getToken(), offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-offers", taskId] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });

  if (isLoading) return <p className="text-sm">Loading offers…</p>;
  if (!offers || offers.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        No offers yet. You&apos;ll see them here as taskers respond.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">Offers ({offers.length})</p>
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="flex items-start justify-between gap-4 rounded-lg border p-4"
        >
          <div className="min-w-0">
            <p className="font-medium">{offer.tasker.name ?? "A tasker"}</p>
            {offer.tasker.rating_count > 0 && (
              <p className="text-xs">
                <Stars value={offer.tasker.rating_avg} className="text-[10px]" />{" "}
                <span className="text-muted-foreground">
                  ({offer.tasker.rating_count})
                </span>
              </p>
            )}
            {offer.message && (
              <p className="mt-1 text-sm text-muted-foreground">
                {offer.message}
              </p>
            )}
            <span
              className={
                "mt-2 inline-block rounded-full border px-2 py-0.5 text-xs " +
                STATUS_STYLES[offer.status]
              }
            >
              {offer.status}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold">{formatInr(offer.amount)}</p>
            {taskStatus === "open" && offer.status === "pending" && (
              <Button
                size="sm"
                className="mt-2"
                onClick={() => accept.mutate(offer.id)}
                disabled={accept.isPending}
              >
                Accept
              </Button>
            )}
          </div>
        </div>
      ))}
      {accept.isError && (
        <p className="text-sm text-red-600">
          {(accept.error as Error).message}
        </p>
      )}
    </div>
  );
}
