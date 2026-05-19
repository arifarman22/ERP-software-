"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { warehouseCreateSchema, type WarehouseCreateInput } from "@/lib/validators/inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Warehouse = { id: string; code: string; name: string; address: string; capacity: number | null; isActive: boolean; _count: { inventoryItems: number } };

function WarehouseForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WarehouseCreateInput>({
    resolver: zodResolver(warehouseCreateSchema),
  });

  async function onSubmit(data: WarehouseCreateInput) {
    setError("");
    const res = await fetch("/api/inventory/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input {...register("name")} placeholder="e.g. Main Warehouse" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input {...register("code")} placeholder="e.g. WH-MAIN" />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Address *</Label>
          <Input {...register("address")} placeholder="Full address" />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Capacity (kg)</Label>
          <Input type="number" {...register("capacity")} placeholder="Optional" />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Warehouse"}
      </Button>
    </form>
  );
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const { openModal } = useModal();

  async function fetch_data() {
    const res = await fetch("/api/inventory/warehouses");
    const json = await res.json();
    setWarehouses(json.data || []);
  }

  useEffect(() => { fetch_data(); }, []);

  const columns: Column<Warehouse>[] = [
    { key: "code", header: "Code", sortable: true, render: (row) => <span className="font-mono">{row.code}</span> },
    { key: "name", header: "Name", sortable: true },
    { key: "address", header: "Address" },
    { key: "capacity", header: "Capacity", render: (row) => row.capacity ? `${Number(row.capacity).toLocaleString()} kg` : "Unlimited" },
    { key: "items", header: "Items", render: (row) => row._count.inventoryItems },
  ];

  return (
    <>
      <PageHeader title="Warehouses" description="Manage storage locations">
        <Button size="sm" onClick={() => openModal({ title: "Add Warehouse", content: <WarehouseForm onSuccess={fetch_data} /> })}>
          Add Warehouse
        </Button>
      </PageHeader>
      <DataTable data={warehouses} columns={columns} searchPlaceholder="Search warehouses..." />
    </>
  );
}
