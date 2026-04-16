"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import {
  createPayPalOrderFromCart,
  approvePaypalOrder,
} from "@/lib/actions/order.actions";

const PlaceOrderPayPal = ({ paypalClientId }: { paypalClientId: string }) => {
  const router = useRouter();
  const { toast } = useToast();
  const orderIdRef = useRef<string | null>(null);

  const handleCreatePaypalOrder = async () => {
    const res = await createPayPalOrderFromCart();
    if (!res.success || !res.data) {
      toast({
        variant: "destructive",
        description: res.message,
      });
      return "";
    }

    orderIdRef.current = res.data.orderId;
    return res.data.paypalOrderId;
  };

  const handleApprovePaypalOrder = async (data: { orderID: string }) => {
    if (!orderIdRef.current) {
      toast({
        variant: "destructive",
        description: "Order ID not found",
      });
      return;
    }

    const res = await approvePaypalOrder(orderIdRef.current, data);
    toast({
      variant: res.success ? "default" : "destructive",
      description: res.message,
    });

    if (res.success) {
      router.push(`/order/${orderIdRef.current}`);
    }
  };

  if (!paypalClientId) {
    return (
      <div className="text-sm text-destructive">
        PayPal client ID is missing. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID or
        PAYPAL_CLIENT_ID.
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId }}>
      <PayPalButtons
        createOrder={handleCreatePaypalOrder}
        onApprove={handleApprovePaypalOrder}
      />
    </PayPalScriptProvider>
  );
};

export default PlaceOrderPayPal;
