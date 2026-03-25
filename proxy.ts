
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const cartId = request.cookies.get("sessionCartId");

  if (!cartId) {
    response.cookies.set("sessionCartId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}