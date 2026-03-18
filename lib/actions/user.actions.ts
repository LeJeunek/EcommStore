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

    const plainPassword = user.password;
    const hashedPassword = hashSync(plainPassword, 10);

    // ✅ ADD THIS (pre-check to prevent Prisma error)
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    // ✅ Create user
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    // ✅ Sign in AFTER successful creation
    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: "User registered successfully" };

  } catch (error: any) {
    if (isRedirectError(error)) throw error;

    if (error.name === 'ZodError') {
      console.error("ZOD_VALIDATION_ERRORS:", error.errors);
    } else {
      console.error("SIGNUP_ERROR:", error);
    }

    const message = await formatError(error);

    return {
      success: false,
      message,
    };
  }
}