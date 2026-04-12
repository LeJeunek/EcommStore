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

const OrderDetailsTable = ({ order }: { order: Order }) => {
  const userAddress = order.shippingAddress as ShippingAddress;

  return (
    <>
      <Card>
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

      <Card>
        <CardContent className="p-4 gap-4">
          <h2 className="text-xl pb-4">Payment Method</h2>
          <p className="mb-2">{order.paymentMethod}</p>
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
    </>
  );
};

export default OrderDetailsTable;
