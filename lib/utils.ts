import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert a prisma object into a regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with decimal places 
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split('.');
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`
}

// Format errors
export async function formatError(error: any) {
  if (error.name === 'ZodError') {
    // Handle Zod errors
    if (error.errors && Array.isArray(error.errors)) {
      const fieldErrors = error.errors.map((issue: any) => issue.message);
      return fieldErrors.join('. ');
    }
    return error.message;
  } 
  else if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
    // Handle Prisma Duplicate Key
    const target = error.meta?.target as string[];
    const field = target && target.length > 0 ? target[0] : 'Field';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } 
  else {
    // Handle other errors
    return typeof error.message === 'string' 
      ? error.message 
      : JSON.stringify(error);
  }
}