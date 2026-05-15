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
import { PAGE_SIZE } from "../constants";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

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
      paymentMethod: user.paymentMethod,
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

export async function createStripeOrderFromCart() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const cart = await getMyCart();

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const user = await getUserById(session.user.id);

    if (!user.address || !user.paymentMethod) {
      throw new Error("Shipping address and payment method are required");
    }

    if (user.paymentMethod.toLowerCase() !== "stripe") {
      throw new Error("Stripe payment method is not selected");
    }

    // Create order
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

    // Create order items
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

    // Create Stripe payment intent ONCE
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(newOrder.totalPrice) * 100),
      currency: "usd",
      metadata: {
        orderId: String(newOrder.id),
      },
    });

    // Save payment intent info on order
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    console.log("Created PaymentIntent:", {
      paymentIntentId: paymentIntent.id,
      orderId: newOrder.id,
      metadata: paymentIntent.metadata,
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe client secret not returned");
    }

    return {
      success: true,
      message: "Stripe order created successfully",
      data: {
        orderId: newOrder.id,
        clientSecret: paymentIntent.client_secret,
        totalPrice: Number(newOrder.totalPrice),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: await formatError(error),
    };
  }
}

export async function approveStripeOrder(
  orderId: string,
  paymentIntentId: string,
) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Stripe payment is not completed");
    }
    if (String(paymentIntent.metadata.orderId) !== String(orderId)) {
      throw new Error("Payment does not belong to this order");
    }

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        email_address: paymentIntent.receipt_email ?? "",
        pricePaid:
          paymentIntent.amount_received != null
            ? (paymentIntent.amount_received / 100).toFixed(2)
            : "0",
      },
    });

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

    return { success: true, message: "Order paid successfully" };
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

export async function updateOrderToPaid({
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
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.isPaid) {
    return order;
  }

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
      user: { select: { id: true, name: true, email: true } },
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
  return res;
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

// Get user's orders

export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();

  if (!session) throw new Error("User is not authorized");

  const data = await prisma.order.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session?.user?.id },
  });
  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Get sales data and order summary

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

export async function getOrderSummary() {
  // Get counts for each resource
  const ordersCount = await prisma.order.count();
  const usersCount = await prisma.user.count();
  const productsCount = await prisma.product.count();

  // Calculate the total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));
  // Get latest sales
  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
    },
    take: 6,
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
  };
}

// Get all orders

export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.OrderWhereInput =
    query && query !== "all"
      ? {
          user: {
            name: {
              contains: query,
              mode: "insensitive",
            } as Prisma.StringFilter,
          },
        }
      : {};

  const data = await prisma.order.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: { user: { select: { name: true } } },
  });

  const dataCount = await prisma.order.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete an order

export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({ where: { id } });
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Order deleted succesfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD order to paid

export async function updateOrderToPaidCOD(orderId: string) {
  try {
    await updateOrderToPaid({ orderId });
    revalidatePath(`/order/${orderId}`);

    return { success: true, message: "Order was marked paid" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD orderr to deliverred

export async function deliverOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.isPaid) throw new Error("Order is not paid");

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Order has been marked delivered",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
