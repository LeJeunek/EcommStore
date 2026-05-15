import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function OrdersStripePaymentSuccessRedirect({
  params,
  searchParams,
}: Props) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else {
      query.append(key, value);
    }
  }

  query.set("id", params.id);

  redirect(`/stripe-payment-success?${query.toString()}`);
}
