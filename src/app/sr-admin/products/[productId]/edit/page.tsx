
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data-async";
import EditProductForm from './EditProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <EditProductForm product={product} />
    </div>
  );
}
