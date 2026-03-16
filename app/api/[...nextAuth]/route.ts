import { handlers } from "@/auth";

export const { GET, POST } = handlers;


export const authOptions = {
  // ... your providers (Google, Credentials, etc)
  callbacks: {
    async session({ session, token }) {
      // Add the role from the token to the session object
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add the role from the user object to the token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
};