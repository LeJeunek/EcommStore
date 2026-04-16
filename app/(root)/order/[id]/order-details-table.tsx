"use client";

import { Badge } from "@/components/ui/badge";
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
import { Order, ShippingAddress } from "@/types";

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

import {
  createPayPalOrder,
  approvePaypalOrder,
} from "@/lib/actions/order.actions";
import { useToast } from "@/hooks/use-toast";

const OrderDetailsTable = ({
  order,
  paypalClientId,
  paymentMethod,
}: {
  order: any; // Using any to handle Prisma types
  paypalClientId: string;
  paymentMethod?: string;
}) => {
  const userAddress = order.shippingAddress as ShippingAddress;
  const { toast } = useToast();

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    let status = "";
    if (isPending) {
      status = "Loading PayPal Buttons...";
    } else if (isRejected) {
      status = "Failed to load PayPal Buttons";
    }
    return status ? <p className="pb-2">{status}</p> : null;
  };

  const handleCreatePaypalOrder = async () => {
    const res = await createPayPalOrder(order.id);
    if (!res.success) {
      toast({
        variant: "destructive",
        description: res.message,
      });
      return ""; // Return empty string to prevent PayPal from opening
    }
    return res.data;
  };

  const handleApprovePaypalOrder = async (data: { orderID: string }) => {
    const res = await approvePaypalOrder(order.id, data);
    toast({
      variant: res.success ? "default" : "destructive",
      description: res.message,
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4 gap-4">
          <h2 className="text-xl pb-4">Shipping Address</h2>
          <p>{userAddress.fullName}</p>
          <p className="mb-2">
            {userAddress.streetAddress}, {userAddress.city}{" "}
            {userAddress.postalCode}, {userAddress.country}
          </p>
          {order.isDelivered ? (
            <Badge variant="secondary">
              Delivered at {order.deliveredAt?.toString()}
            </Badge>
          ) : (
            <Badge variant="destructive">Not delivered</Badge>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4 gap-4">
          <h2 className="text-xl pb-4">Payment Method</h2>
          <p className="mb-2">{paymentMethod || "Not selected"}</p>
          {order.isPaid ? (
            <Badge variant="secondary">
              Paid at {order.paidAt?.toString()}
            </Badge>
          ) : (
            <Badge variant="destructive">Not paid</Badge>
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
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems.map((item: any) => (
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
          {/* Paypal Payment */}

          {!order.isPaid && paymentMethod?.toLowerCase() === "paypal" && (
            <div className="mt-4">
              <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                <PrintLoadingState />
                <PayPalButtons
                  createOrder={handleCreatePaypalOrder}
                  onApprove={handleApprovePaypalOrder}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default OrderDetailsTable;
