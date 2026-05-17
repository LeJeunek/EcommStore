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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

const StripePayment = ({
  priceInCents,
  orderId,
}: {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
}) => {
  const { theme, systemTheme } = useTheme();

  const StripeForm = () => {
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

      if (result.error) {
        setErrorMessage(
          result.error.message ?? "An unexpected error occurred.",
        );

        setIsLoading(false);
      }
    };

    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="text-xl">Stripe Checkout</div>

        {errorMessage && <div className="text-destructive">{errorMessage}</div>}

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
}
