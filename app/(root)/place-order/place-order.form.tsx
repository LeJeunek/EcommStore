"use client";
import { Check, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { createOrder } from "@/lib/actions/order.actions";

const PlaceOrderForm = () => {
  const PlaceOrderButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <Loader className="animate-spin w-4 h-4" />
        ) : (
          <Check className="w-4 h-4" />
        )}{" "}
        Place Order
      </Button>
    );
  };

  return (
    <form action={createOrder} className="w-full">
      <PlaceOrderButton />
    </form>
  );
};

export default PlaceOrderForm;
