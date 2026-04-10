import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// ============================================
// REGEX PATTERNS FOR HEADER FILTERING
// ============================================
const HEADER_PATTERNS = {
  // Headers to sanitize/remove (security sensitive)
  sanitize: [
    /^cookie$/i,
    /^authorization$/i,
    /^host$/i,
    /^referer$/i,
    /^origin$/i,
    /^content-length$/i,
    /^set-cookie$/i,
  ],

  // Headers to forward/clone to response
  forward: [/^x-/i, /^accept/i, /^user-agent$/i, /^content-type$/i],

  // Security-critical headers to never expose
  sensitive: [
    /^authorization$/i,
    /^cookie$/i,
    /^set-cookie$/i,
    /^proxy-authorization$/i,
  ],
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a header name matches any regex pattern in array
 */
const matchesAnyPattern = (headerName: string, patterns: RegExp[]): boolean => {
  return patterns.some((pattern) => pattern.test(headerName));
};

/**
 * Clone and sanitize request headers
 * Removes sensitive headers specified in patterns
 */
const cloneAndSanitizeHeaders = (
  request: NextRequest,
  sanitizePatterns: RegExp[] = HEADER_PATTERNS.sanitize
): Headers => {
  const cloned = new Headers(request.headers);
  const headersToRemove: string[] = [];

  // Identify headers that match sanitize patterns
  cloned.forEach((_, name) => {
    if (matchesAnyPattern(name, sanitizePatterns)) {
      headersToRemove.push(name);
    }
  });

  // Remove identified headers
  headersToRemove.forEach((name) => {
    cloned.delete(name);
  });

  return cloned;
};

/**
 * Add custom headers to response
 * Includes cloned headers with x-cloned prefix and custom headers
 */
const addCustomResponseHeaders = (
  request: NextRequest,
  response: NextResponse,
  clonedHeaders: Headers
): NextResponse => {
  // Add cloned headers with x-cloned prefix
  clonedHeaders.forEach((value, key) => {
    response.headers.set(`x-cloned-${key}`, value);
  });

  // Add custom headers based on request state
  response.headers.set(
    "x-session-cart-cookie-set",
    request.cookies.has("sessionCartId") ? "true" : "false"
  );

  // Add timestamp header
  response.headers.set("x-middleware-timestamp", new Date().toISOString());

  // Add session info if available
  response.headers.set(
    "x-middleware-executed",
    "true"
  );

  return response;
};

/**
 * Ensure session cart cookie exists
 * Creates UUID-based cart ID if not present
 */
const ensureSessionCartCookie = (
  request: NextRequest,
  response: NextResponse
): NextResponse => {
  if (!request.cookies.has("sessionCartId")) {
    response.cookies.set("sessionCartId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return response;
};

// ============================================
// MIDDLEWARE EXPORT
// ============================================

export async function middleware(request: NextRequest) {
  // Clone and sanitize request headers
  const clonedHeaders = cloneAndSanitizeHeaders(request);

  // Create response
  let response = NextResponse.next();

  // Add custom headers to response
  response = addCustomResponseHeaders(request, response, clonedHeaders);

  // Ensure session cart cookie exists
  response = ensureSessionCartCookie(request, response);

  return response;
}

// ============================================
// MIDDLEWARE CONFIG
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
