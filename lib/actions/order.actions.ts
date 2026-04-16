"use server";

import { prisma } from "@/lib/prisma";
import { paypal } from "@/lib/paypal";
import { formatError } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentResult } from "@/types";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";

// Create order from cart
export async function createOrder() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("User not authenticated");

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const user = await getUserById(session.user.id);
    if (!user.address || !user.paymentMethod) {
      throw new Error("Shipping address and payment method are required");
    }

    // Create order and order items
    const orderData = {
      userId: session.user.id,
      shippingAddress: user.address,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    };

    const newOrder = await prisma.order.create({
      data: orderData,
    });

    // Create order items from cart items
    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          name: item.name,
          slug: item.slug,
          image: item.image,
        },
      });
    }

    // Clear the cart
    await prisma.cart.delete({
      where: { id: cart.id },
    });

    revalidatePath("/place-order");
    redirect(`/order/${newOrder.id}`);
  } catch (error) {
    throw new Error(await formatError(error));
  }
}

export async function createPayPalOrderFromCart() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("User not authenticated");

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const user = await getUserById(session.user.id);
    if (!user.address || !user.paymentMethod) {
      throw new Error("Shipping address and payment method are required");
    }

    const newOrder = await prisma.order.create({
      data: {
        userId: session.user.id,
        shippingAddress: user.address,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
        paymentMethod: user.paymentMethod,
      },
    });

    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          name: item.name,
          slug: item.slug,
          image: item.image,
        },
      });
    }

    const paypalOrder = await paypal.createOrder(Number(newOrder.totalPrice));
    if (!paypalOrder?.id) {
      throw new Error("PayPal order creation failed");
    }

    // Don't clear cart yet - wait for PayPal approval
    return {
      success: true,
      message: "PayPal order created successfully",
      data: {
        orderId: newOrder.id,
        paypalOrderId: paypalOrder.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: await formatError(error),
    };
  }
}

// Approve paypal order and update order to paid

export async function approvePaypalOrder(
  orderId: string,
  data: { orderID: string },
) {
  try {
    // Get order from database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) throw new Error("Order not found");

    const captureData = await paypal.capturePayment(data.orderID);

    if (!captureData || captureData.status !== "COMPLETED") {
      throw new Error("PayPal payment capture failed or not completed");
    }

    // Update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid:
          captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    // Clear the cart after successful payment
    const session = await auth();
    if (session?.user?.id) {
      const cart = await prisma.cart.findFirst({
        where: { userId: session.user.id },
      });
      if (cart) {
        await prisma.cart.delete({ where: { id: cart.id } });
      }
    }

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Your order has been paid",
    };
  } catch (error) {
    return { success: false, message: await formatError(error) };
  }
}

async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  // Get order from database
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.isPaid) throw new Error("Order is already paid");

  // Update product stock for each order item
  for (const item of order.orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: -item.qty } },
    });
  }

  // Set the order to paid
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      isPaid: true,
      paidAt: new Date(),
      paymentResult,
    },
    include: {
      orderItems: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!updatedOrder) throw new Error("Order not found after update");
  return updatedOrder;
}

export async function getOrderById(id: string) {
  const res = await prisma.order.findFirst({
    where: { id },
    include: {
      orderItems: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!res) {
    throw new Error("Order not found");
  }
  return res as any; // We'll handle type conversion in the component
}

export async function createPayPalOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

    if (!paypalOrder?.id) {
      throw new Error("PayPal order creation failed");
    }

    return {
      success: true,
      message: "PayPal order created successfully",
      data: paypalOrder.id,
    };
  } catch (error) {
    return {
      success: false,
      message: await formatError(error),
    };
  }
}
