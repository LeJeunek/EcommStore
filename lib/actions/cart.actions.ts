// lib/actions/cart.actions.ts
'use server';

import { CartItem } from "@/types";
import { cookies } from "next/headers";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { prisma } from "../prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
  );
  const shippingPrice = round2(itemsPrice > 100 ? 0 : 10);
  const taxPrice = round2(0.15 * itemsPrice);
  const totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    // ✅ cookies() must be awaited in Next 16
    const cookieStore = await cookies();
    const sessionCartId = cookieStore.get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    const session = await auth();
    const userId = session?.user?.id as string | undefined;

const cart = await prisma.cart.findFirst({
  where: {
    OR: [
      { userId: userId ?? undefined },
      { sessionCartId },
    ],
  },
});
    // Force price to number here to avoid Decimal issues
    const item = cartItemSchema.parse(data);

    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });
    console.log(product);
    if (!product) throw new Error("Product not found");

    // 🆕 CREATE CART
    if (!cart) {
      const newCart = insertCartSchema.parse({
        userId,
        items: [item],
        sessionCartId,
        ...calcPrice([item]),
      });

      await prisma.cart.create({
        data: newCart,
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    }

    // 🧠 EXISTING CART LOGIC (IMMUTABLE)
    const currentItems = Array.isArray(cart.items) ? cart.items : [];

    const existingIndex = currentItems.findIndex(
      (x) => x.productId === item.productId
    );

    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      const existingItem = currentItems[existingIndex];

      if (product.stock < existingItem.qty + 1) {
        throw new Error("Not enough stock");
      }

      updatedItems = currentItems.map((x, i) =>
        i === existingIndex ? { ...x, qty: x.qty + 1 } : x
      );
    } else {
      if (product.stock < 1) throw new Error("Not enough stock");
      updatedItems = [...currentItems, item];
    }

    // ✅ update cart with sanitized items
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: updatedItems.map((i) => ({ ...i, price: Number(i.price) })),
        ...calcPrice(updatedItems),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} ${existingIndex > -1 ? "updated in" : "added to"} cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  try {
    const cookieStore = await cookies();
    const sessionCartId = cookieStore.get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    const session = await auth();
    const userId = session?.user?.id as string | undefined;

    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionCartId },
    });

    if (!cart && userId) {
      cart = await prisma.cart.findFirst({
        where: { sessionCartId },
      });
    }

    if (!cart) return undefined;

    return convertToPlainObject({
      ...cart,
      items: (cart.items as CartItem[]).map((i) => ({
        ...i,
        price: i.price.toString(), // Keep as string to match CartItem type
      })),
      itemsPrice: cart.itemsPrice.toString(),
      totalPrice: cart.totalPrice.toString(),
      shippingPrice: cart.shippingPrice.toString(),
      taxPrice: cart.taxPrice.toString(),
    });
  } catch (error) {
    console.error("getMyCart error:", error);
    return undefined;
  }
}

export async function removeItemFromCart(productId: string) {
  try {
      // ✅ cookies() must be awaited in Next 16
    const cookieStore = await cookies();
    const sessionCartId = cookieStore.get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    // Get Product 
    const product = await prisma.product.findFirst({
      where: {id: productId }
    });
    if (!product) throw new Error('Product not found');

    // Get user cart
    const cart = await getMyCart();
    if(!cart) throw new Error('Cart not found');
    
    // Check for item
    const exist = (cart.items as CartItem[]).find((x) => x.productId === productId);
    if (!exist) throw new Error('Item not found');

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from the cart
      cart.items = (cart.items as CartItem[]).filter((x) => x.productId !== exist.productId)
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty = exist.qty - 1;
    }
    // Update cart in database

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateItemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      }
    });
    
    revalidatePath(`/product/${product.slug}`);
    return {
      success: true,
      message: `${product.name} was removed from the cart`
    }



  } catch (error) {
    return { success: false, message: formatError(error)}
  }
}