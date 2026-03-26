// actions/product.actions.ts
'use server';
import { prisma } from "@/lib/prisma";

export const getLatestProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // Convert decimals to numbers for UI
  return products.map(p => ({
    ...p,
    price: Number(p.price),
    rating: Number(p.rating),
  }));
};

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug } });
  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
    rating: Number(product.rating),
  };
}