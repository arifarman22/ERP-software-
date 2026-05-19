"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { BarChart, DonutChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ReportControls } from "../report-controls";
import { Package, Warehouse, AlertTriangle, IndianRupee } from "lucide-react";

export default function InventoryReportPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports/inventory").then((r) => r.json()).then((j) => setData(j.data));
  }, []);

  if (!data) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const columns: Column<any>[] = [
    { key: "product", header: "Product", sortable: true },
    { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "category", header: "Category" },
    { key: "warehouse", header: "Warehouse" },
    { key: "quantity", header: "Qty (kg)", sortable: true },
    { key: "value", header: "Value", sortable: true, render: (r) => `₹${Math.round(r.value).toLocaleString()}` },
  ];

  return (
    <>
      <PageHeader title="Inventory Report">
        <ReportControls period="30d" onPeriodChange={() => {}} reportType="inventory" />
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Items" value={data.totalItems} icon={Package} />
        <StatCard title="Total Quantity" value={`${data.totalQuantity.toLocaleString()} kg`} icon={Warehouse} />
        <StatCard title="Total Value" value={`₹${Math.round(data.totalValue).toLocaleString()}`} icon={IndianRupee} />
        <StatCard title="Low Stock" value={data.lowStockCount} icon={AlertTriangle} className={data.lowStockCount > 0 ? "border-destructive/50" : ""} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart title="Stock by Warehouse" data={data.byWarehouse.map((w: any) => ({ label: w.warehouse, value: Math.round(w.totalQty) }))} />
        <DonutChart title="Stock by Category" data={data.byCategory.map((c: any, i: number) => ({ label: c.category, value: Math.round(c.totalQty), color: ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5] }))} />
      </div>

      <DataTable data={data.items} columns={columns} searchPlaceholder="Search inventory..." pageSize={15} />
    </>
  );
}
