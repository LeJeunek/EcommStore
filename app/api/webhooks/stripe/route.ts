import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

export async function POST(req: NextRequest) {
  // Build the webook event
  const event = await Stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature")!,
    process.env.STRIPE_WEBHOOK_SECRET as string,
  );

  // Check for successful payment

  if (event.type === "charge.succeeded") {
    const { object } = event.data;

    // Update order status
    await updateOrderToPaid({
      orderId: object.metadata.orderId,
      paymentResult: {
        id: object.id,
        status: "COMPLETED",
        email_address: object.billing_details.email!,
        pricePaid: (object.amount / 100).toFixed(),
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
