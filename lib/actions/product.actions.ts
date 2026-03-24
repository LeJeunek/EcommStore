// actions/product.actions.ts
'use server';

import { prisma } from "@/lib/prisma"

export const getLatestProducts = async () => {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("🛠 ACTION CALLED: Attempting DB fetch...");

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    }));

  } catch (error: any) {
    console.error("❌ DB ERROR:", error.message);
    return [];
  }
};

export async function getProductBySlug(slug: string) {
  
  return prisma.product.findFirst({
    where: { slug },
  });
}