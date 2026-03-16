// middleware.ts
import { auth } from "./auth"; // Import the auth function you exported from auth.ts

export default auth((req) => {
  // Optional: add logic here
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};