// actions/product.actions.ts
"use server";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "../constants";
import { convertToPlainObject, formatError, success } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { insertProductSchema, updateProductSchema } from "../validators";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const getLatestProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // Convert decimals to numbers for UI
  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    rating: Number(p.rating),
  }));
};

//  Get a single product by it's Slug
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug } });
  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
    rating: Number(product.rating),
  };
}
//  Get a single product by it's ID
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({ where: { id: productId } });

  return convertToPlainObject(data);
}

// Get all products

export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price: string;
  rating: string;
  sort?: string;
}) {
  //  Query FIlter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== "all"
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          } as Prisma.StringFilter,
        }
      : {};
  // Category filter
  const categoryFilter = category && category !== "all" ? { category } : {};

  //  Price Filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== "all"
      ? {
          price: {
            gte: Number(price.split("-")[0]),
            lte: Number(price.split("-")[1]),
          },
        }
      : {};

  // Rating Filter
  const ratingFilter =
    rating && rating !== "all"
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  // 2. Apply the 'where' filter to the query
  const data = await prisma.product.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    }, // <--- Add this
    orderBy:
      sort === "lowest"
        ? { price: "asc" }
        : sort === "highest"
          ? { price: "desc" }
          : sort === "rating"
            ? { rating: "desc" }
            : { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // 3. Apply the 'where' filter to the count so pagination stays accurate
  const dataCount = await prisma.product.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}
// Delete a product

export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });
    if (!productExists) throw new Error("Product not found");

    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product deleted succesfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product

export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const product = insertProductSchema.parse(data);

    await prisma.product.create({ data: product });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product created succesfully ",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a product

export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });
    if (!productExists) throw new Error("Product not found");
    await prisma.product.update({
      where: { id: product.id },
      data: product,
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product updated succesfully ",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories

export async function getAllCategories() {
  const data = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
  });
  return data;
}

//  Get featured products

export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return convertToPlainObject(data);
}
