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
import { approveStripeOrder } from "@/lib/actions/order.actions";

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

  //  Stripe form component
  const StripeForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (stripe == null || elements == null) return;
      setIsLoading(true);

      const result = await stripe.confirmPayment({
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
        return;
      }

      // At this point, result should have paymentIntent
      const paymentIntent = (result as { paymentIntent: any }).paymentIntent;
      if (paymentIntent?.status === "succeeded") {
        const res = await approveStripeOrder(orderId, paymentIntent.id);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsLoading(false);
          return;
        }
        // Redirect to success page since payment succeeded immediately
        window.location.href = `/stripe-payment-success?id=${orderId}&payment_intent=${paymentIntent.id}`;
        return;
      }

      setErrorMessage("Payment did not complete. Please try again.");
      setIsLoading(false);
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
          disabled={stripe == null || elements == null || isLoading}
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
      stripe={stripePromise}
    >
      <StripeForm />
    </Elements>
  );
};

export default StripePayment;
