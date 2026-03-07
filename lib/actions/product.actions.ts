'use server';
import { prisma } from "@/lib/prisma";

export async function getLatestProducts() {
  // Returns an array of products
  return prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
  });
}