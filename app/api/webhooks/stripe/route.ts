import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    console.error("Webhook verification failed:", error);

    return NextResponse.json(
      { message: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  // ONLY HANDLE THIS EVENT
  if (event.type === "payment_intent.succeeded") {
    try {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.log("PAYMENT INTENT:", paymentIntent.id);

      const orderId = paymentIntent.metadata.orderId;

      if (!orderId) {
        console.error("Missing orderId metadata");

        return NextResponse.json(
          { message: "Missing orderId metadata" },
          { status: 400 },
        );
      }

      // Find order
      const order = await prisma.order.findFirst({
        where: { id: orderId },
        include: {
          user: true,
        },
      });

      if (!order) {
        console.error("Order not found");

        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 },
        );
      }

      // Prevent duplicate processing
      if (order.isPaid) {
        return NextResponse.json({
          message: "Order already paid",
        });
      }

      // Update order
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          email_address:
            paymentIntent.receipt_email ?? "",
          pricePaid: (
            paymentIntent.amount_received / 100
          ).toFixed(2),
        },
      });

      // Clear cart
      if (order.userId) {
        await prisma.cart.deleteMany({
          where: {
            userId: order.userId,
          },
        });
      }

      console.log("Order updated successfully");
    } catch (error) {
      console.error("Webhook processing error:", error);

      return NextResponse.json(
        { message: "Webhook processing failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    received: true,
  });
}