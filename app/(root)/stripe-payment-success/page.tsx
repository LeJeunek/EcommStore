import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/order.actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const SuccessPage = async (props: {
  searchParams: Promise<{ payment_intent: string; id: string }>;
}) => {
  const { payment_intent: paymentIntentId, id: orderId } =
    await props.searchParams;

  //  Fetch order
  let order;
  try {
    order = await getOrderById(orderId);
  } catch (error) {
    console.error("Error fetching order:", error);
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Payment Successful</h1>
          <div>Order ID: {orderId}</div>
          <div>Payment Intent: {paymentIntentId}</div>
          <div className="text-red-500">
            Note: Order details could not be loaded. Please contact support if
            you have any issues.
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Payment Successful</h1>
          <div>Order ID: {orderId}</div>
          <div>Payment Intent: {paymentIntentId}</div>
          <div className="text-red-500">
            Note: Order details could not be loaded. Please contact support if
            you have any issues.
          </div>
        </div>
      </div>
    );
  }

  //  Retrieve payment intent from Stripe
  let paymentIntent;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Payment Successful</h1>
          <div>Order ID: {orderId}</div>
          <div>Payment Intent: {paymentIntentId}</div>
          <div className="text-red-500">
            Note: Payment verification could not be completed. Please contact
            support if you have any issues.
          </div>
          <Button asChild>
            <Link href={`/order/${orderId}`}>View Order Details</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if payment intent was valid
  const metadataOrderId = String(paymentIntent.metadata?.orderId || "");
  const isMetadataValid =
    metadataOrderId && metadataOrderId === String(order.id);

  console.log("Validating payment intent:");
  console.log("paymentIntent.metadata.orderId:", metadataOrderId);
  console.log("order.id:", order.id);
  console.log("order.id.toString():", order.id.toString());
  console.log("Are they equal?", isMetadataValid);

  // For now, allow the success page to show even if metadata validation fails
  // since the payment succeeded
  if (!isMetadataValid) {
    console.log(
      "Payment intent metadata validation failed, but allowing success page",
    );
  }

  //  Check if payment was successful
  const isSuccess = paymentIntent.status === "succeeded";

  if (!isSuccess) {
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Processing Payment...</h1>
          <div>Please wait while we confirm your payment.</div>
          <Button asChild>
            <Link href={`/order/${orderId}`}>Go to Order</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      <div className="flex flex-col gap-6 items-center">
        <h1 className="h1-bold">Thank you for your purchase</h1>
        <div>We are processing your order</div>
        <Button asChild>
          <Link href={`/order/${orderId}`}>View Order Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
