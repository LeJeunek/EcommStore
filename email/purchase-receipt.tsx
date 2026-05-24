import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  Img,
} from "@react-email/components";
import { Order } from "@/types";

import { formatCurrency } from "@/lib/utils";

// 1. Define Props type
type OrderInformationProps = {
  order: Order;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const SAFE_PREVIEW_PRODUCTS = [
  {
    name: "Polo Sporting Stretch Shirt",
    price: "59.99",
    stock: 1,
    image: "/static/p1-1.jpg",
    slug: "polo",
    productId: "p1",
  },
  {
    name: "Brooks Brothers Shirt",
    price: "85.90",
    stock: 2,
    image: "/static/p2-1.jpg",
    slug: "brooks",
    productId: "p2",
  },
];

PurchaseReceiptEmail.PreviewProps = {
  order: {
    id: "preview-12345",
    userId: "123",
    user: { name: "John Doe", email: "test@test.com" },
    paymentMethod: "stripe",
    shippingAddress: {
      fullName: "John Doe",
      streetAddress: "123 Main St",
      city: "New York",
      postalCode: "10001",
      country: "US",
    },
    createdAt: new Date(),
    totalPrice: "145.89",
    taxPrice: "0",
    shippingPrice: "0",
    itemsPrice: "145.89",
    // 3. Map this local constant instead of the database import
    orderItems: SAFE_PREVIEW_PRODUCTS.map((x) => ({
      name: x.name,
      orderId: "123",
      productId: x.productId,
      slug: x.slug,
      qty: x.stock,
      image: x.image,
      price: x.price,
    })),
    isDelivered: true,
    deliveredAt: new Date(),
    isPaid: true,
    paidAt: new Date(),
    paymentResult: {
      id: "123",
      status: "succeeded",
      pricePaid: "145.89",
      email_address: "test@test.com",
    },
  },
} as OrderInformationProps;

export default function PurchaseReceiptEmail({ order }: OrderInformationProps) {
  return (
    <Html>
      <Preview>View Order Receipt</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Purchase Receipt</Heading>
            <Section>
              <Row>
                <Column>
                  <Text className="text-gray-500">Order ID</Text>
                  <Text>{order.id.toString()}</Text>
                </Column>
                <Column>
                  <Text className="mt-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap">
                    Order Date
                  </Text>
                  <Text className="mt-0 mr-4">
                    {dateFormatter.format(order.createdAt)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className="border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4 ">
              {order.orderItems.map((item) => (
                <Row key={item.productId} className="mt-8">
                  <Column className="w-28">
                    <Img width="80" alt={item.name} src={item.image} />
                  </Column>
                  <Column className="align-top">
                    {item.name} x {item.qty}
                  </Column>
                  <Column align="right" className="align-top">
                    {formatCurrency(item.price)}
                  </Column>
                </Row>
              ))}
              {[
                { name: "Items", price: order.itemsPrice },
                { name: "Tax", price: order.taxPrice },
                { name: "Shipping", price: order.shippingPrice },
                { name: "Total", price: order.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name} className="py-1">
                  <Column align="right" className="px-2">
                    {name}:
                  </Column>
                  <Column align="right" width={70} className="align-top">
                    <Text className="m-0">{formatCurrency(price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// 3. Backend Logic
export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  const { Resend } = await import("resend");
  const { SENDER_EMAIL, APP_NAME } = await import("@/lib/constants");

  const resend = new Resend(process.env.RESEND_API_KEY as string);

  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: order.user.email,
    subject: `Order Confirmation ${order.id}`,
    react: <PurchaseReceiptEmail order={order} />,
  });
};
