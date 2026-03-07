export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import ProductList from "@/components/shared/product/product-list";
import { getLatestProducts } from "@/lib/actions/product.actions";

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const formattedProducts = latestProducts.map((product) => ({
    ...product,
    price: product.price.toString(),
    rating: product.rating.toString(),
  }))

  return (
    <>
      <ProductList
        data={formattedProducts}
        title="Newest Arrivals"
      />
    </>
  );
};

export default Homepage;
