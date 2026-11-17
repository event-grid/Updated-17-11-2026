"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { accountLabel, useSession } from "@/features/auth/session-store";
import { ApiError, callBrowserApi, shoppingApi } from "@/lib/api/client";
import type { CheckoutSession } from "@/lib/api/generated/customer";

import { keys } from "./hooks";

/**
 * Razorpay Standard Checkout in the browser. The page only opens Razorpay's own payment window; card, UPI and bank
 * details never touch EVENTGRID. After payment the backend verifies Razorpay's signature before the booking changes,
 * so a closed window or a tampered response never marks anything as paid.
 */

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
};

type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Razorpay could not be loaded. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export type PayState = { status: "idle" | "starting" | "open" | "verifying"; error?: string };

/**
 * Starts (or retries) payment: `start` returns the CheckoutSession from the backend, then Razorpay opens.
 * On success the booking page is shown once the backend has verified the payment.
 */
export function usePayWithRazorpay() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useSession();
  const [state, setState] = useState<PayState>({ status: "idle" });

  async function pay(start: () => Promise<CheckoutSession>) {
    setState({ status: "starting" });
    let checkout: CheckoutSession;
    try {
      checkout = await callBrowserApi(start);
      // The cart became a booking (or a retry order was opened): refresh both.
      void client.invalidateQueries({ queryKey: keys.cart });
      void client.invalidateQueries({ queryKey: keys.bookings });
      await loadCheckout();
    } catch (error) {
      setState({ status: "idle", error: error instanceof ApiError || error instanceof Error ? error.message : "Could not start payment." });
      return;
    }

    const bookingPath = `/account/bookings/${checkout.bookingReference}`;
    const account = session.status === "signed-in" ? session.account : undefined;
    const razorpay = new window.Razorpay!({
      key: checkout.razorpayKeyId,
      amount: checkout.amountMinor,
      currency: checkout.currency,
      name: "EVENTGRID",
      description: `Advance for booking ${checkout.bookingReference}`,
      order_id: checkout.razorpayOrderId,
      prefill: account
        ? { name: account.displayName ?? undefined, email: account.email ?? undefined, contact: account.phone ?? undefined }
        : undefined,
      notes: { booking: checkout.bookingReference },
      theme: { color: "#d9735a" },
      handler: async (response) => {
        setState({ status: "verifying" });
        try {
          const booking = await callBrowserApi(() =>
            shoppingApi.verifyBookingPayment({
              reference: checkout.bookingReference,
              paymentVerification: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            }),
          );
          client.setQueryData(keys.booking(checkout.bookingReference), booking);
          void client.invalidateQueries({ queryKey: keys.bookings });
          void client.invalidateQueries({ queryKey: keys.notifications });
          router.push(`${bookingPath}?paid=1`);
        } catch (error) {
          setState({ status: "idle", error: error instanceof ApiError ? error.message : "We could not verify the payment." });
          router.push(bookingPath);
        }
      },
      modal: {
        // Closed without paying: the booking waits for payment and can be paid from its page.
        ondismiss: () => {
          setState({ status: "idle" });
          router.push(bookingPath);
        },
      },
    });
    razorpay.on("payment.failed", (r) => setState({ status: "open", error: r.error?.description ?? "The payment failed. You can try again." }));
    setState({ status: "open" });
    razorpay.open();
  }

  return { state, pay, payerLabel: session.status === "signed-in" ? accountLabel(session.account) : undefined };
}
