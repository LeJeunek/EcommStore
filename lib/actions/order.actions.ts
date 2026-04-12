"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError } from "@/lib/utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { insertOrderSchema } from "@/lib/validators";
import { CartItem } from "@/types";

export async function createOrder(formData: FormData) {
  try {
    const session = await auth();
    if (!session) throw new Error("User not authenticated");

    const cart = await getMyCart();
    const userId = session.user.id;

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      redirect("/cart");
    }
    if (!user.address) {
      redirect("/shipping-address");
    }
    if (!user.paymentMethod) {
      redirect("/payment-method");
    }

    const validatedOrder = insertOrderSchema.parse({
      userId,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: Number(cart.itemsPrice).toFixed(2),
      shippingPrice: Number(cart.shippingPrice).toFixed(2),
      taxPrice: Number(cart.taxPrice).toFixed(2),
      totalPrice: Number(cart.totalPrice).toFixed(2),
    });

    // Extract only fields that Prisma Order model accepts
    const orderData = {
      userId: validatedOrder.userId,
      shippingAddress: validatedOrder.shippingAddress,
      itemsPrice: validatedOrder.itemsPrice,
      shippingPrice: validatedOrder.shippingPrice,
      taxPrice: validatedOrder.taxPrice,
      totalPrice: validatedOrder.totalPrice,
    };

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({ data: orderData });

      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            orderId: insertedOrder.id,
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error("Failed to create order");

    redirect(`/order/${insertedOrderId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    throw new Error(await formatError(error));
  }
}

// Get order by ID
export async function getOrderById(orderId: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("User not authenticated");

    const data = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        orderItems: true,
        user: { select: { name: true, email: true, paymentMethod: true } },
      },
    });
    return convertToPlainObject(data);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    throw new Error(await formatError(error));
  }
}
