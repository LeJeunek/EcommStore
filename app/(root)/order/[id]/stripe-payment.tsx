"use client";

import { FormEvent, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Appearance } from "@stripe/stripe-js";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

type Props = {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
};

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

    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet.");
      return;
    }

    setIsLoading(true);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message || "Payment form error.");
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // FIXED: Updated the path layout to match app/(root)/order/[id]/stripe-payment-success
        return_url: `${window.location.origin}/order/${orderId}/stripe-payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="text-xl font-semibold">Stripe Checkout</div>

      {errorMessage && <div className="text-destructive">{errorMessage}</div>}

      <PaymentElement />

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

export default function StripePayment({
  priceInCents,
  orderId,
  clientSecret,
}: Props) {
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;

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

  if (!clientSecret) {
    return (
      <div className="text-red-500 font-medium">
        Missing Stripe client secret
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeForm priceInCents={priceInCents} orderId={orderId} />
    </Elements>
  );
}
