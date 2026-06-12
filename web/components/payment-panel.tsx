"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ApiError,
  checkout,
  completeTask,
  getTaskPayment,
  verifyPayment,
  type CheckoutResponse,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

function FeeBreakdown({
  amount,
  feePercent,
}: {
  amount: number;
  feePercent: number;
}) {
  const fee = Math.round((amount * feePercent) / 100);
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Agreed amount</dt>
        <dd>{formatInr(amount)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">
          Platform fee ({feePercent}%)
        </dt>
        <dd>−{formatInr(fee)}</dd>
      </div>
      <div className="flex justify-between border-t pt-1 font-medium">
        <dt>Tasker receives</dt>
        <dd>{formatInr(amount - fee)}</dd>
      </div>
    </dl>
  );
}

export function PaymentPanel({
  taskId,
  agreedAmount,
  isPoster,
}: {
  taskId: string;
  agreedAmount: number;
  isPoster: boolean;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", taskId],
    queryFn: async () => {
      try {
        return await getTaskPayment(await getToken(), taskId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["payment", taskId] });
    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
  };

  const pay = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res: CheckoutResponse = await checkout(token, taskId);
      if (res.dev) return; // dev fallback already marked it held
      await loadRazorpay();
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: res.key_id,
          order_id: res.order_id,
          amount: res.amount_paise,
          currency: res.currency,
          name: "TaskMarket",
          description: "Authorize task payment",
          handler: async (resp: any) => {
            try {
              await verifyPayment(token, {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.open();
      });
    },
    onSuccess: refresh,
  });

  const complete = useMutation({
    mutationFn: async () => completeTask(await getToken(), taskId),
    onSuccess: refresh,
  });

  if (isLoading) return null;

  const feePercent = payment?.service_fee_percent ?? 15;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="font-medium">Payment</p>

      {(!payment || payment.status === "authorized") && (
        <>
          <FeeBreakdown amount={agreedAmount} feePercent={feePercent} />
          {isPoster ? (
            <div className="space-y-1">
              <Button
                onClick={() => pay.mutate()}
                disabled={pay.isPending}
              >
                {pay.isPending
                  ? "Processing…"
                  : `Pay & authorize ${formatInr(agreedAmount)}`}
              </Button>
              {pay.isError && (
                <p className="text-sm text-red-600">
                  {(pay.error as Error).message}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for the poster to authorize payment.
            </p>
          )}
        </>
      )}

      {payment?.status === "held" && (
        <>
          <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Funds authorized and held in escrow.
          </p>
          <FeeBreakdown amount={payment.amount} feePercent={feePercent} />
          {isPoster ? (
            <div className="space-y-1">
              <Button
                onClick={() => complete.mutate()}
                disabled={complete.isPending}
              >
                {complete.isPending
                  ? "Releasing…"
                  : "Confirm completion & release payment"}
              </Button>
              {complete.isError && (
                <p className="text-sm text-red-600">
                  {(complete.error as Error).message}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;ll be paid once the poster confirms completion.
            </p>
          )}
        </>
      )}

      {payment?.status === "released" && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Completed · released {formatInr(payment.net_amount ?? 0)} to the tasker
          {payment.fee_amount != null && (
            <> ({formatInr(payment.fee_amount)} platform fee)</>
          )}
          .
        </p>
      )}

      {payment?.status === "failed" && (
        <p className="text-sm text-red-600">Payment failed. Please try again.</p>
      )}
    </div>
  );
}
