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

// Move outside component so it isn't recreated on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

const StripeForm = ({
  priceInCents,
  orderId,
}: {
  priceInCents: number;
  orderId: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage("");

    // Validate PaymentElement first
    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message ?? "Payment form is not ready.");
      setIsLoading(false);
      return;
    }

    // Confirm payment
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe-payment-success?id=${orderId}`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "Payment failed.");
      setIsLoading(false);
      return;
    }

    // Successful payment without redirect
    if (result.paymentIntent?.status === "succeeded") {
      window.location.href = `/stripe-payment-success?id=${orderId}`;
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="text-2xl font-semibold">Stripe Checkout</div>

      {errorMessage && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border p-4">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading
          ? "Processing..."
          : `Pay ${formatCurrency(priceInCents / 100)}`}
      </Button>
    </form>
  );
};

const StripePayment = ({
  priceInCents,
  orderId,
  clientSecret,
}: {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
}) => {
  const { theme, systemTheme } = useTheme();

  // Properly typed Stripe appearance theme
  const appearanceTheme: Appearance["theme"] =
    theme === "dark"
      ? "night"
      : theme === "light"
        ? "stripe"
        : systemTheme === "dark"
          ? "night"
          : "stripe";

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: appearanceTheme,
      } satisfies Appearance,
    }),
    [clientSecret, appearanceTheme],
  );

  // Prevent rendering before clientSecret exists
  if (!clientSecret) {
    return <div className="text-center py-10">Loading payment form...</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <Elements stripe={stripePromise} options={options}>
        <StripeForm priceInCents={priceInCents} orderId={orderId} />
      </Elements>
    </div>
  );
};

export default StripePayment;
