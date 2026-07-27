/**
 * Client-side Paddle.js loader for the overlay checkout. Initialized once; the
 * checkout-completed event triggers whatever handler the Billing tab registers
 * (so it can reload the subscription status). No-op when Paddle isn't configured
 * or Stripe is the active provider.
 */
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

/** Whether Paddle is the active client-side provider (matches the backend). */
export const isPaddleProvider = () =>
  (process.env.NEXT_PUBLIC_BILLING_PROVIDER ?? "paddle") !== "stripe";

let paddlePromise: Promise<Paddle | undefined> | null = null;
let onComplete: (() => void) | null = null;

/** Register a callback fired when a Paddle overlay checkout completes. */
export function setPaddleOnComplete(cb: (() => void) | null) {
  onComplete = cb;
}

/** Get the initialized Paddle.js instance (or undefined if not configured). */
export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return Promise.resolve(undefined);
    const environment =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";
    paddlePromise = initializePaddle({
      environment,
      token,
      eventCallback: (event) => {
        if (event?.name === "checkout.completed") onComplete?.();
      },
    });
  }
  return paddlePromise;
}

/** Open the overlay checkout for a server-created transaction. */
export async function openPaddleCheckout(transactionId: string, successUrl?: string) {
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Paddle is not configured");
  paddle.Checkout.open({
    transactionId,
    settings: {
      displayMode: "overlay",
      ...(successUrl ? { successUrl } : {}),
    },
  });
}
