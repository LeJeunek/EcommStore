import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    return NextResponse.json({ message: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = String(paymentIntent.metadata?.orderId || "");

    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID metadata" }, { status: 400 });
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

    return NextResponse.json({
      message: "Updated order to paid successfully",
    });
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const orderId = String(charge.metadata?.orderId || "");

    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID metadata" }, { status: 400 });
    }

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: charge.id,
        status: charge.status,
        email_address: charge.billing_details?.email ?? "",
        pricePaid: (charge.amount / 100).toFixed(2),
      },
    });

    return NextResponse.json({
      message: "Updated order to paid successfully",
    });
  }

  return NextResponse.json({
    message: "Event type not handled",
  });
}
