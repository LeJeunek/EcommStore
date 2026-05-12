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
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { ShippingAddress } from "@/types"; // Removed unused 'Order' import

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

import {
  createPayPalOrder,
  approvePaypalOrder,
  updateOrderToPaidCOD,
  deliverOrder,
} from "@/lib/actions/order.actions";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

const OrderDetailsTable = ({
  order,
  paypalClientId,
  isAdmin,
  stripeClientSecret,
}: {
  order: any;
  paypalClientId: string;
  paymentMethod?: string;
  isAdmin: boolean;
  stripeClientSecret?: string;
}) => {
  // Destructuring fixed (removed the trailing 'isPaid' and naming conflict)
  const {
    id,
    shippingAddress,
    orderItems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod, // This is pulled from order now
    isDelivered,
    isPaid,
    paidAt,
    deliveredAt,
  } = order;

  const userAddress = shippingAddress as ShippingAddress;
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
    const res = await createPayPalOrder(id);
    if (!res.success) {
      toast({
        variant: "destructive",
        description: res.message,
      });
      return "";
    }
    return res.data;
  };

  const handleApprovePaypalOrder = async (data: { orderID: string }) => {
    const res = await approvePaypalOrder(id, data);
    toast({
      variant: res.success ? "default" : "destructive",
      description: res.message,
    });
  };

  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidCOD(id);
            toast({
              variant: res.success ? "default" : "destructive",
              description: res.message,
            });
          })
        }
      >
        {isPending ? "processing..." : "Mark as Paid"}
      </Button>
    );
  };

  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrder(id);
            toast({
              variant: res.success ? "default" : "destructive",
              description: res.message,
            });
          })
        }
      >
        {isPending ? "processing..." : "Mark as Delivered"}
      </Button>
    );
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
          {isDelivered ? (
            <Badge variant="secondary">
              Delivered at {deliveredAt?.toString()}
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
          {isPaid ? (
            <Badge variant="secondary">Paid at {paidAt?.toString()}</Badge>
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
              {orderItems.map((item: any) => (
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

          {!isPaid && paymentMethod === "PayPal" && (
            <div>
              <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                <PrintLoadingState />
                <PayPalButtons
                  createOrder={handleCreatePaypalOrder}
                  onApprove={handleApprovePaypalOrder}
                />
              </PayPalScriptProvider>
            </div>
          )}

          {/* Temporary test - remove the checks */}

          {isAdmin && !isPaid && paymentMethod === "CashOnDelivery" && (
            <div className="mt-4">
              <MarkAsPaidButton />
            </div>
          )}
          {isAdmin && isPaid && !isDelivered && (
            <div className="mt-4">
              <MarkAsDeliveredButton />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default OrderDetailsTable;
