export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  brand: string;
  description: string;
  stock: number;
  price: string;  // Changed from Decimal to string
  rating: string; // Changed from Decimal to string
  numReviews: number;
  isFeatured: boolean;
  banner: string | null;
  createdAt: Date;
}