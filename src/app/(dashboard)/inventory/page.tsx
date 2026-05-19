"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Package, Warehouse, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { ProductForm } from "./products/product-form";
import { MovementForm } from "./movements/movement-form";
import { AdjustmentForm } from "./adjustments/adjustment-form";
import { BarcodeScanner } from "./barcode-scanner";

type InventoryItem = {
  id: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  product: { name: string; sku: string; category: string };
  warehouse: { name: string; code: string };
  batch?: { batchNumber: string } | null;
  updatedAt: string;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, warehouses: 0, lowStock: 0, value: 0 });
  const [loading, setLoading] = useState(true);
  const { openModal } = useModal();

  async function fetchData() {
    setLoading(true);
    try {
      const [itemsRes, alertsRes, warehousesRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/alerts"),
        fetch("/api/inventory/warehouses"),
      ]);
      const itemsData = await itemsRes.json();
      const alertsData = await alertsRes.json();
      const warehousesData = await warehousesRes.json();

      const inventoryItems = itemsData.data || [];
      setItems(inventoryItems);
      setStats({
        total: inventoryItems.length,
        warehouses: (warehousesData.data || []).length,
        lowStock: (alertsData.data || []).length,
        value: inventoryItems.reduce((sum: number, i: any) => sum + Number(i.quantity) * Number(i.costPerUnit), 0),
      });
    } catch { /* handled by empty state */ }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const columns: Column<InventoryItem>[] = [
    { key: "product", header: "Product", sortable: true, render: (row) => (
      <div>
        <p className="font-medium">{row.product.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{row.product.sku}</p>
      </div>
    )},
    { key: "category", header: "Category", render: (row) => <Badge variant="secondary">{row.product.category}</Badge> },
    { key: "warehouse", header: "Warehouse", render: (row) => row.warehouse.name },
    { key: "batch", header: "Batch", render: (row) => row.batch?.batchNumber ? <span className="font-mono text-xs">{row.batch.batchNumber}</span> : "—" },
    { key: "quantity", header: "Qty", sortable: true, render: (row) => (
      <span className={Number(row.quantity) <= Number(row.minStock) ? "text-red-600 font-semibold" : ""}>
        {Number(row.quantity).toLocaleString()} kg
      </span>
    )},
    { key: "costPerUnit", header: "Cost/Unit", sortable: true, render: (row) => `₹${Number(row.costPerUnit).toFixed(2)}` },
    { key: "status", header: "Status", render: (row) => {
      const isLow = Number(row.quantity) <= Number(row.minStock) && Number(row.minStock) > 0;
      return <Badge variant={isLow ? "destructive" : "default"}>{isLow ? "Low Stock" : "In Stock"}</Badge>;
    }},
  ];

  function handleAddProduct() {
    openModal({ title: "Add New Product", size: "lg", content: <ProductForm onSuccess={fetchData} /> });
  }

  function handleStockMovement() {
    openModal({ title: "Record Stock Movement", size: "lg", content: <MovementForm onSuccess={fetchData} /> });
  }

  function handleAdjustment() {
    openModal({ title: "Inventory Adjustment", content: <AdjustmentForm items={items} onSuccess={fetchData} /> });
  }

  function handleBarcode() {
    openModal({ title: "Barcode Scanner", content: <BarcodeScanner /> });
  }

  return (
    <>
      <PageHeader title="Inventory Management" description="Track stock across warehouses with batch-level visibility">
        <Button variant="outline" size="sm" onClick={handleBarcode}>Scan Barcode</Button>
        <Button variant="outline" size="sm" onClick={handleAdjustment}>Adjust Stock</Button>
        <Button variant="outline" size="sm" onClick={handleStockMovement}>
          <ArrowRightLeft className="h-4 w-4 mr-1" /> Movement
        </Button>
        <Button size="sm" onClick={handleAddProduct}>Add Product</Button>
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Items" value={stats.total} icon={Package} />
        <StatCard title="Warehouses" value={stats.warehouses} icon={Warehouse} />
        <StatCard title="Low Stock Alerts" value={stats.lowStock} icon={AlertTriangle} className={stats.lowStock > 0 ? "border-destructive/50" : ""} />
        <StatCard title="Total Value" value={`₹${stats.value.toLocaleString()}`} icon={Package} />
      </StatGrid>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by product, SKU, warehouse..."
        pageSize={15}
        actions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => openModal({
            title: "Adjust: " + row.product.name,
            content: <AdjustmentForm items={[row]} preselectedId={row.id} onSuccess={fetchData} />,
          })}>
            Adjust
          </Button>
        )}
      />
    </>
  );
}
