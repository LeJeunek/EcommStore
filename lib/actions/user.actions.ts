"use server";

import { signInFormSchema, signUpFormSchema, shippingAddressSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/lib/prisma";
import { formatError } from "../utils";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";
import { redirect } from "next/navigation";



// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // ✅ Get callback URL from form data
    const callbackUrl = (formData.get("callbackUrl") as string) || "/";

    await signIn("credentials", user);

    // ✅ Redirect after successful login
    redirect(callbackUrl);
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

// Get user by the id

export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId }
  });
  if (!user) throw new Error("User not found");
  return user;
}

// Update user address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('User not found');
    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {address}
    });

    return {
      success: true,
      message: 'User updated succesfully'
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}