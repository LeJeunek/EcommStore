import { getPrisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from 'next/cache'; // Add this

export const getLatestProducts = async () => {
  noStore(); // Forces this function to fetch fresh data every time
  const prisma = getPrisma();
  
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: Number(process.env.LATEST_PRODUCTS_LIMIT) || 4,
  });

  console.log("FETCHED NAMES:", products.map(p => p.name)); // LOG THIS
  return products;
};

export async function getProductBySlug(slug: string) {
  if (!slug) return null;
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { slug }
  })
  if (!product) return null;

  return {
    ...product,
    price: product.price.toString(),
    rating: product.rating.toString(),
  };
}