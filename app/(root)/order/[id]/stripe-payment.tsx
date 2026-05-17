"use client";

import { FormEvent, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// LOAD STRIPE OUTSIDE COMPONENT
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Props = {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
};

function StripeForm({
  priceInCents,
  orderId,
}: {
  priceInCents: number;
  orderId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    // STRIPE NOT READY
    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet.");
      return;
    }

    setIsLoading(true);

    // VALIDATE ELEMENTS
    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message || "Payment form error.");
      setIsLoading(false);
      return;
    }

    // CONFIRM PAYMENT
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe-payment-success?id=${orderId}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Stripe Checkout</h2>

      {errorMessage && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border bg-background p-4 min-h-[220px]">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isLoading}
      >
        {isLoading
          ? "Processing..."
          : `Pay ${formatCurrency(priceInCents / 100)}`}
      </Button>
    </form>
  );
}

export default function StripePayment({
  priceInCents,
  orderId,
  clientSecret,
}: Props) {
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;

  // FIX STRIPE THEME TYPE
  const appearanceTheme: Appearance["theme"] =
    currentTheme === "dark" ? "night" : "stripe";

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: appearanceTheme,
      } satisfies Appearance,
    }),
    [clientSecret, appearanceTheme],
  );

  // DEBUG CLIENT SECRET
  console.log("CLIENT SECRET:", clientSecret);

  // PREVENT PAYMENT ELEMENT FROM FAILING SILENTLY
  if (!clientSecret) {
    return (
      <div className="text-red-500 font-medium">
        Missing Stripe client secret
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Elements stripe={stripePromise} options={options}>
        <StripeForm priceInCents={priceInCents} orderId={orderId} />
      </Elements>
    </div>
  );
}
