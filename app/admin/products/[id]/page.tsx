import ProductForm from "@/components/admin/product-form";
import { getProductById } from "@/lib/actions/product.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Update Product",
};

const AdminProductUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) return notFound();

  // Convert Decimal types to string to match the Product type expected by ProductForm
  const formattedProduct = {
    ...product,
    price: product.price.toString(),
    rating: product.rating.toString(),
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Update Product</h1>
      {/* Use formattedProduct here */}
      <ProductForm
        type="Update"
        product={formattedProduct}
        productId={product.id}
      />
    </div>
  );
};

export default AdminProductUpdatePage;
