"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/ui/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  return <ProductForm productId={Number(id)} />;
}
