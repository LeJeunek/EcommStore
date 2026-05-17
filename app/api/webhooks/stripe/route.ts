import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { updateOrderToPaid } from "@/lib/actions/order.actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 },
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    // PAYMENT INTENT SUCCEEDED
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const orderId = paymentIntent.metadata.orderId;

      if (!orderId) {
        return NextResponse.json(
          { error: "Missing orderId metadata" },
          { status: 400 },
        );
      }

      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          email_address: paymentIntent.receipt_email ?? "",
          pricePaid: (paymentIntent.amount_received / 100).toFixed(2),
        },
      });

      console.log("Order marked paid:", orderId);

      return NextResponse.json({
        message: "Order updated successfully",
      });
    }

    return NextResponse.json({
      message: `Unhandled event type: ${event.type}`,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
