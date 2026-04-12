import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { ShippingAddress } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  const order = await getOrderById(id);
  const userAddress = order.shippingAddress as ShippingAddress;

  return (
    <>
      <CheckoutSteps current={4} />

      <h1 className="py-4 text-2xl">Order {order.id}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Shipping Address</h2>
              <p>{userAddress.fullName}</p>
              <p>
                {userAddress.streetAddress}, {userAddress.city}{" "}
                {userAddress.postalCode}, {userAddress.country}
              </p>
              {order.isDelivered ? (
                <div className="text-green-600">
                  Delivered at {order.deliveredAt?.toString()}
                </div>
              ) : (
                <div className="text-orange-600">Not delivered</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Payment Method</h2>
              <p>{order.user?.paymentMethod}</p>
              {order.isPaid ? (
                <div className="text-green-600">
                  Paid at {order.paidAt?.toString()}
                </div>
              ) : (
                <div className="text-orange-600">Not paid</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Items</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="flex items-center">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          />
                          <span className="px-2">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2">{item.qty}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.price))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
