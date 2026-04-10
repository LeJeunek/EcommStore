// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Empty array here; we add providers in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Define protected routes that require authentication
      const protectedRoutes = [
        "/shipping-address",
        "/payment-method",
        "/place-order",
        // Add other protected routes here
      ];

      // Check if current path is protected
      const isProtectedRoute = protectedRoutes.some(route =>
        nextUrl.pathname.startsWith(route)
      );

      // If route is protected and user is not logged in, redirect to sign-in
      if (isProtectedRoute && !isLoggedIn) {
        const signInUrl = new URL("/sign-in", nextUrl);
        signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(signInUrl);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;