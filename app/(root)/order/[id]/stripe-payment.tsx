"use client";
import { FormEvent, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  LinkAuthenticationElement,
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
          return_url: `${window.location.origin}/order/stripe-payment-success?id=${orderId}&payment_intent={PAYMENT_INTENT}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(
          result.error.message ?? "An unexpected error occurred.",
        );
        setIsLoading(false);
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        const res = await approveStripeOrder(orderId, result.paymentIntent.id);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsLoading(false);
          return;
        }
        //  Redirect will happen automatically via Stripe's confirmPayment redirect
        return;
      }
      }

      setErrorMessage("Payment did not complete. Please try again.");
      setIsLoading(false);
    };
    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="text-xl">Stripe Checkout</div>
        {errorMessage && <div className="text-destructive">{errorMessage}</div>}
        <PaymentElement />
        <div>
          <LinkAuthenticationElement
            onChange={(e) => {
              setEmail(e.value.email);
            }}
          />
        </div>
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
