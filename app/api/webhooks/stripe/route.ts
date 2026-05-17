import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

// 1. Initialize the Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    // 2. Call constructEvent on the initialized 'stripe' object
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
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
          // 3. Provide a fallback string in case the email wasn't collected
          email_address: object.billing_details?.email || "Not provided",
          pricePaid: (object.amount / 100).toFixed(),
        },
      });

      return NextResponse.json({
        message: "updateOrderToPaid was successful",
      });
    }

    return NextResponse.json({
      message: `Unhandled event type: ${event.type}`,
    });
  } catch (error) {
    // 4. Catch and log errors so you can actually see what went wrong
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json(
      {
        message: "Webhook handler failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
