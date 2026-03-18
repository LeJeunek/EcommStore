"use server";

import { signInFormSchema, signUpFormSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/lib/prisma";
import { formatError } from "../utils";

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", user);

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: "Invalid email or password" };
  }
}

// Sign user out
export async function signOutUser() {
  await signOut();
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    // 1. Store plain password for signIn, but hash for the DB
    const plainPassword = user.password;
    const hashedPassword = hashSync(plainPassword, 10);

    // 2. Create the user in Prisma
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    // 3. Sign in using the PLAIN password
    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: "User registered successfully" };
  } catch (error) {
    // 4. Handle Redirects (This MUST be first)
    if (isRedirectError(error)) throw error;
    console.error('DETAILED_SIGNUP_ERROR:', error);

    // 5. Use the formatted error message
    const message = await formatError(error);
    return { success: false, message };
  }
}