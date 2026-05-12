import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import OrderDetailsTable from "./order-details-table";
import Stripe from "stripe";
import StripePayment from "./stripe-payment";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user?.id) throw new Error("User not authenticated");

  const order = await getOrderById(id);
  const safeOrder = JSON.parse(JSON.stringify(order));
  if (!order) {
    notFound();
  }

  const user = await getUserById(session.user.id);

  let client_secret = null;

  //  Check if is not paid and using stripe
  if (order.paymentMethod?.toLowerCase() === "stripe" && !order.isPaid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalPrice) * 100),
      currency: "usd",
      metadata: { orderId: order.id },
    });

    client_secret = paymentIntent.client_secret;
  }
  return (
    <>
      <CheckoutSteps current={4} />

      <h1 className="py-4 text-2xl">Order {order.id}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
          <OrderDetailsTable
            order={safeOrder}
            paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
            stripeClientSecret={client_secret}
            paymentMethod={user.paymentMethod || undefined}
            isAdmin={session?.user?.role === "admin" || false}
          />
        </div>
        <div>
          <Card>
            <CardContent className="p-4 gap-4 space-y-4">
              <div className="flex justify-between">
                Items
                <div>{formatCurrency(Number(order.itemsPrice))}</div>
              </div>
              <div className="flex justify-between">
                Tax
                <div>{formatCurrency(Number(order.taxPrice))}</div>
              </div>
              <div className="flex justify-between">
                Shipping
                <div>{formatCurrency(Number(order.shippingPrice))}</div>
              </div>
              <div className="flex justify-between">
                Total
                <div>{formatCurrency(Number(order.totalPrice))}</div>
              </div>
              {/* THE FIX: Use toLowerCase() to match "stripe" vs "Stripe" */}
              <div className="pt-4 border-t mt-4 space-y-2">
                {/* The Logic Fix */}
                {!order.isPaid &&
                  order.paymentMethod?.toLowerCase() === "stripe" &&
                  client_secret && (
                    <StripePayment
                      priceInCents={Math.round(Number(order.totalPrice) * 100)}
                      orderId={order.id}
                      clientSecret={client_secret}
                    />
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;
