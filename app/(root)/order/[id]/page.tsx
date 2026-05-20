import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import OrderDetailsTable from "./order-details-table";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user?.id) throw new Error("User not authenticated");

  const order = await getOrderById(id);
  if (!order) notFound();

  const user = await getUserById(session.user.id);

  const safeOrder = JSON.parse(JSON.stringify(order));

  return (
    <>
      <CheckoutSteps current={4} />

      <h1 className="py-4 text-2xl">Order {order.id}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
          <OrderDetailsTable
            order={safeOrder}
            paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
            paymentMethod={user.paymentMethod || undefined}
            isAdmin={session.user.role === "admin"}
          />
        </div>

        <div>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{formatCurrency(Number(order.itemsPrice))}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(Number(order.taxPrice))}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(Number(order.shippingPrice))}</span>
              </div>

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(order.totalPrice))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;
