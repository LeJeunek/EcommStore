"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Product } from "@/types";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";

// Use 'any' for the prop type temporarily to stop the build from crashing
// while we normalize the data inside the component.
const ProductCarousel = ({ data }: { data: any }) => {
  // 1. NORMALIZE DATA:
  // This finds the array whether it's 'data', 'data.data', or just the raw object.
  const products: Product[] = Array.isArray(data)
    ? data
    : data?.data && Array.isArray(data.data)
      ? data.data
      : [];

  // 2. CHECK: If we still don't have products, don't crash, but don't hide either
  if (products.length === 0) {
    console.warn("ProductCarousel: No products found in 'data' prop", data);
    return null;
  }

  return (
    <Carousel
      className="w-full mb-12"
      opts={{ loop: true }}
      plugins={[
        Autoplay({
          delay: 2000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {products.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className="relative mx-auto">
                <Image
                  src={product.banner!}
                  alt={product.name}
                  height={0}
                  width={0}
                  sizes="100vw"
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 flex items-end justify-center">
                  <h2 className="bg-gray-900 bg-opacity-50 text-2xl font-bold px-2 text-white">
                    {product.name}
                  </h2>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default ProductCarousel;
