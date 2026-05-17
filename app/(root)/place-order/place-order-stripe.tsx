"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  approveStripeOrder,
  createStripeOrderFromCart,
} from "@/lib/actions/order.actions";
import { useToast } from "@/hooks/use-toast";

/* =========================
   STRIPE FORM
========================= */
const StripeCheckoutForm = ({
  orderId,
  totalPrice,
}: {
  orderId: string;
  totalPrice: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!stripe || !elements) {
      setErrorMessage("Stripe is not ready.");
      return;
    }

    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe-payment-success?id=${orderId}`,
      },
    });

    if (result.error) {
      setErrorMessage(result.error.message || "Payment failed");
      setIsProcessing(false);
      return;
    }

    if ("paymentIntent" in result) {
      const paymentIntent = (
        result as unknown as {
          paymentIntent: { id: string; status?: string };
        }
      ).paymentIntent;

      if (paymentIntent?.status === "succeeded") {
        const res = await approveStripeOrder(orderId, paymentIntent.id);

        if (!res.success) {
          setErrorMessage(res.message);
          setIsProcessing(false);
          return;
        }

        router.push(
          `/stripe-payment-success?id=${orderId}&payment_intent=${paymentIntent.id}`,
        );
        return;
      }
    }

    setIsProcessing(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage && <div className="text-destructive">{errorMessage}</div>}

      <PaymentElement />

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : `Pay ${formatCurrency(totalPrice)}`}
      </Button>
    </form>
  );
};

/* =========================
   MAIN COMPONENT
========================= */
const PlaceOrderStripe = () => {
  const { toast } = useToast();

  const [orderData, setOrderData] = useState<{
    orderId: string;
    clientSecret: string;
    totalPrice: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
  );

  const hasCreated = useRef(false);

  useEffect(() => {
    const createOrder = async () => {
      if (hasCreated.current) return;
      hasCreated.current = true;

      try {
        const res = await createStripeOrderFromCart();

        if (!res.success || !res.data) {
          setError(res.message);
          toast({
            variant: "destructive",
            description: res.message,
          });
          return;
        }

        setOrderData({
          orderId: res.data.orderId,
          clientSecret: res.data.clientSecret,
          totalPrice: res.data.totalPrice,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to create order";

        setError(msg);
        toast({
          variant: "destructive",
          description: msg,
        });
      } finally {
        setIsLoading(false);
      }
    };

    createOrder();
  }, [toast]);

  if (isLoading) {
    return <div className="text-center">Loading Stripe checkout...</div>;
  }

  if (error || !orderData) {
    return (
      <div className="text-destructive">
        {error || "Failed to initialize Stripe checkout"}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: orderData.clientSecret,
      }}
    >
      <StripeCheckoutForm
        orderId={orderData.orderId}
        totalPrice={orderData.totalPrice}
      />
    </Elements>
  );
};

export default PlaceOrderStripe;
