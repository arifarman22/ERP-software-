"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { ProductForm } from "./product-form";

type Product = { id: string; name: string; sku: string; category: string; teaGrade: string | null; unitWeight: number; unit: string; basePrice: number; isActive: boolean };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { openModal } = useModal();

  async function fetchProducts() {
    const res = await fetch("/api/inventory/products");
    const json = await res.json();
    setProducts(json.data || []);
  }

  useEffect(() => { fetchProducts(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/inventory/products/${id}`, { method: "DELETE" });
    fetchProducts();
  }

  const columns: Column<Product>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "sku", header: "SKU", sortable: true, render: (row) => <span className="font-mono text-xs">{row.sku}</span> },
    { key: "category", header: "Category", render: (row) => <Badge variant="secondary">{row.category}</Badge> },
    { key: "teaGrade", header: "Grade", render: (row) => row.teaGrade || "—" },
    { key: "unitWeight", header: "Weight", render: (row) => `${Number(row.unitWeight)} ${row.unit}` },
    { key: "basePrice", header: "Price", sortable: true, render: (row) => `₹${Number(row.basePrice).toFixed(2)}` },
    { key: "isActive", header: "Status", render: (row) => <Badge variant={row.isActive ? "default" : "outline"}>{row.isActive ? "Active" : "Inactive"}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Products" description="Manage tea products and SKUs">
        <Button size="sm" onClick={() => openModal({ title: "Add Product", size: "lg", content: <ProductForm onSuccess={fetchProducts} /> })}>
          Add Product
        </Button>
      </PageHeader>
      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products..."
        actions={(row) => (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        )}
      />
    </>
  );
}
