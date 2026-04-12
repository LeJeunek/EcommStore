import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  }).$extends({
    result: {
      product: {
        price: {
          compute(product) {
            return product.price.toString();
          },
        },
        rating: {
          compute(product) {
            return product.rating.toString();
          },
        },
      },
      cart: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart) {
            return cart.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart) {
            return cart.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart) {
            return cart.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart) {
            return cart.totalPrice.toString();
          },
        },
      },
      order: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart) {
            return cart.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart) {
            return cart.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart) {
            return cart.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart) {
            return cart.totalPrice.toString();
          },
        },
      },
      orderItem: {
        price: {
          compute(cart) {
            return cart.price.toString();
          },
        },
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
