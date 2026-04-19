import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async session({ session, token, user, trigger }: any) {
      // Safer guard (prevents crashes if undefined)
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.name = token.name;

        if (trigger === "update") {
          session.user.name = user.name;
        }
      }

      return session;
    },

    async jwt({ token, user, trigger, session }: any) {
      // Assign user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === "NO_NAME") {
          token.name = user.email!.split("@")[0];

          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }
        if (session?.user.name && trigger === "update") {
          token.name = session.user.name;
        }

        if (trigger === "signIn" || trigger === "signUp") {
          const cookiesObject = await cookies();
          const sessionCartId = cookiesObject.get("sessionCartId")?.value;

          if (sessionCartId) {
            const sessionCart = await prisma.cart.findFirst({
              where: { sessionCartId },
            });

            if (sessionCart) {
              // Delete current user cart
              await prisma.cart.deleteMany({
                where: { userId: user.id },
              });

              // Assign session cart to user
              await prisma.cart.update({
                where: { id: sessionCart.id },
                data: { userId: user.id },
              });
            }
          }
        }
      } // ✅ FIXED: properly closed if(user)

      return token;
    },
  },

  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        console.log("LOGIN ATTEMPT:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        console.log("USER FROM DB:", user);

        if (!user || !user.password) {
          console.log("❌ User not found or no password");
          return null;
        }

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        console.log("PASSWORD MATCH:", isMatch);

        if (!isMatch) {
          console.log("❌ Password incorrect");
          return null;
        }

        console.log("✅ LOGIN SUCCESS");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
