import { getPrisma } from "@/lib/prisma";

export const getLatestProducts = async () => {
  const prisma = getPrisma();
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: Number(process.env.LATEST_PRODUCTS_LIMIT) || 4,
  });
};