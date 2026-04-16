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
  if (!order) {
    notFound();
  }

  const user = await getUserById(session.user.id);

  return (
    <>
      <CheckoutSteps current={4} />

      <h1 className="py-4 text-2xl">Order {order.id}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
          <OrderDetailsTable
            order={order}
            paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
            paymentMethod={user.paymentMethod || undefined}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsPage;
