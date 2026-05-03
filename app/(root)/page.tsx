export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import ProductList from "@/components/shared/product/product-list";
import { getLatestProducts, getFeaturedProducts } from "@/lib/actions/product.actions";
import ProductCarousel from "@/components/shared/product/product-carousel";

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  const formattedProducts = latestProducts.map((product) => ({
    ...product,
    price: product.price.toString(),
    rating: product.rating.toString(),
  }))

  return (
    <>
    { featuredProducts.length > 0 && <ProductCarousel data={featuredProducts} />}
      <ProductList
        data={formattedProducts}
        title="Newest Arrivals"
      />
    </>
  );
};

export default Homepage;
