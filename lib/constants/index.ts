export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ProStore";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "ProStore is a modern e-commerce platform built with Next.js and TypeScript, offering a seamless shopping experience with a wide range of products and secure transactions.";
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_PRODUCT_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIIT) || 4;


export const signInDefaultValues = {
    email: '',
    password: '',
};

export const signUpDefaultValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export const shippingAddressDefaultValues = {
    fullName: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    country: '',
}