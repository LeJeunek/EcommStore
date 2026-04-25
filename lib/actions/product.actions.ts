// actions/product.actions.ts
"use server";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "../constants";
import { convertToPlainObject, formatError, success } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { insertProductSchema, updateProductSchema } from "../validators";
import { z } from "zod";

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
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
}) {
  const data = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
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
