"use client";

import { FormEvent, useState } from "react";
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

const StripePayment = ({
  priceInCents,
  orderId,
  clientSecret,
}: {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
}) => {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
  );

  const { theme, systemTheme } = useTheme();

  const StripeForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // 1. Safety check for Stripe library loading
      if (!stripe || !elements) return;

      setIsLoading(true);

      // 2. Validate form and mount state first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(
          submitError.message ?? "Payment elements are not ready.",
        );
        setIsLoading(false);
        return; // Stop execution early if elements aren't mounted/valid
      }

      // 3. Safe to confirm payment now
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/stripe-payment-success?id=${orderId}`,
        },
      });

      // Only handle errors here
      if (result.error) {
        setErrorMessage(
          result.error.message ?? "An unexpected error occurred.",
        );
        setIsLoading(false);
      }

      // DO NOT handle success here
      // Stripe redirects automatically
    };

    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="text-xl">Stripe Checkout</div>

        {errorMessage && <div className="text-destructive">{errorMessage}</div>}

        <PaymentElement />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading
            ? "Purchasing..."
            : `Purchase ${formatCurrency(priceInCents / 100)}`}
        </Button>
      </form>
    );
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
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
      }}
    >
      <StripeForm />
    </Elements>
  );
};

export default StripePayment;
