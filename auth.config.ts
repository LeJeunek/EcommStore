// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Empty array here; we add providers in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // Add your protected route logic here
      return true; 
    },
  },
} satisfies NextAuthConfig;