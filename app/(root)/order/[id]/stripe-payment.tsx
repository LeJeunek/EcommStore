"use client";

import { FormEvent, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// Move stripePromise OUTSIDE component
// so it isn't recreated on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
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

    setErrorMessage("");

    // Stripe.js not yet loaded
    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet.");
      return;
    }

    setIsLoading(true);

    // Validate payment form first
    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message || "Payment form is not ready.");
      setIsLoading(false);
      return;
    }

    // Confirm payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe-payment-success?id=${orderId}`,
      },
    });

    // Only errors handled here
    if (error) {
      setErrorMessage(error.message || "Something went wrong with payment.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">Stripe Checkout</h2>

      {errorMessage && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
          {errorMessage}
        </div>
      )}

      {/* THIS is the actual Stripe UI */}
      <div className="rounded-xl border p-4">
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

  // Prevent Elements from rerendering unnecessarily
  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme:
          theme === "dark"
            ? "night"
            : theme === "light"
              ? "stripe"
              : systemTheme === "dark"
                ? "night"
                : "stripe",
      },
    }),
    [clientSecret, theme, systemTheme],
  );

  // Prevent rendering before clientSecret exists
  if (!clientSecret) {
    return (
      <div className="text-center text-muted-foreground">
        Loading payment form...
      </div>
    );
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
