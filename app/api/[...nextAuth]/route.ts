import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const sanitizeRequestHeaders = (request: NextRequest) => {
  const cloned = new Headers(request.headers);
  ["cookie", "authorization", "host", "referer", "origin", "content-length"].forEach((name) => {
    cloned.delete(name);
  });
  return cloned;
};

const addResponseHeaders = (request: NextRequest, response: NextResponse) => {
  const clonedHeaders = sanitizeRequestHeaders(request);
  clonedHeaders.forEach((value, key) => {
    response.headers.set(`x-cloned-${key}`, value);
  });
  response.headers.set(
    "x-session-cart-cookie-set",
    request.cookies.has("sessionCartId") ? "false" : "true"
  );
  return response;
};

const ensureSessionCartIdCookie = (request: NextRequest, response: NextResponse) => {
  if (!request.cookies.has("sessionCartId")) {
    response.cookies.set("sessionCartId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
};

const handleAuthRequest = async (
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>
) => {
  const originalResponse = await handler(request);
  const response = new NextResponse(originalResponse.body, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: originalResponse.headers,
  });

  ensureSessionCartIdCookie(request, response);
  addResponseHeaders(request, response);

  return response;
};

export const GET = (request: NextRequest) => handleAuthRequest(request, handlers.GET);
export const POST = (request: NextRequest) => handleAuthRequest(request, handlers.POST);
