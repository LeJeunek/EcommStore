import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";

const SuccessPage = async (props: {
  params: Promise<{ id: string }>; // 1. Switched searchParams to params
}) => {
  const { id: orderId } = await props.params; // 2. Pulling the ID cleanly from the folder structure

  let order;

  try {
    order = await getOrderById(orderId);
  } catch (error) {
    console.error(error);
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Payment Processing</h1>
          <div>We are still confirming your payment.</div>
          <Button asChild>
            <Link href={`/order/${orderId}`}>View Order</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return notFound();
  }

  // Webhook has not updated DB yet
  if (!order.isPaid) {
    return (
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="h1-bold">Payment Processing</h1>
          <div>
            Your payment was submitted successfully. We are waiting for
            confirmation from Stripe.
          </div>
          <Button asChild>
            <Link href={`/order/${orderId}`}>Refresh Order Status</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      <div className="flex flex-col gap-6 items-center">
        <h1 className="h1-bold">Thank you for your purchase</h1>
        <div>Your payment has been confirmed.</div>
        <Button asChild>
          <Link href={`/order/${orderId}`}>View Order Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
