"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rawMaterialSchema, type RawMaterialInput } from "@/lib/validators/production";

type Material = { id: string; name: string; code: string; category: string; unit: string; quantity: number; minStock: number; costPerUnit: number; supplier: string | null };

const CATEGORIES = ["GREEN_LEAF", "DRIED_LEAF", "FLAVORING", "ADDITIVE", "PACKAGING_MATERIAL"];

function MaterialForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RawMaterialInput>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: { unit: "kg", quantity: 0, minStock: 0 },
  });

  async function onSubmit(data: RawMaterialInput) {
    setError("");
    const res = await fetch("/api/production/raw-materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { setError((await res.json()).error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
        <div className="space-y-2"><Label>Code *</Label><Input {...register("code")} placeholder="e.g. RM-GRN-001" />{errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}</div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select onValueChange={(v) => setValue("category", v as any)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Cost/Unit (₹) *</Label><Input type="number" step="0.01" {...register("costPerUnit")} /></div>
        <div className="space-y-2"><Label>Min Stock</Label><Input type="number" step="0.01" {...register("minStock")} /></div>
        <div className="space-y-2"><Label>Supplier</Label><Input {...register("supplier")} /></div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Creating..." : "Add Material"}</Button>
    </form>
  );
}

function StockAdjust({ material, onSuccess }: { material: Material; onSuccess: () => void }) {
  const [qty, setQty] = useState(0);
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await fetch("/api/production/raw-materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: material.id, quantity: qty, type }),
    });
    setLoading(false);
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">Current: <span className="font-semibold">{Number(material.quantity)} {material.unit}</span></p>
      <div className="flex gap-2">
        <Select value={type} onValueChange={(v) => setType(v as any)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADD">Add</SelectItem><SelectItem value="DEDUCT">Deduct</SelectItem></SelectContent></Select>
        <Input type="number" step="0.01" value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} placeholder="Quantity" />
      </div>
      <Button onClick={handleSubmit} disabled={loading || qty <= 0} className="w-full">{loading ? "Updating..." : "Update Stock"}</Button>
    </div>
  );
}

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const { openModal } = useModal();

  async function fetchMaterials() {
    const res = await fetch("/api/production/raw-materials");
    const json = await res.json();
    setMaterials(json.data || []);
  }

  useEffect(() => { fetchMaterials(); }, []);

  const columns: Column<Material>[] = [
    { key: "code", header: "Code", sortable: true, render: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { key: "name", header: "Name", sortable: true },
    { key: "category", header: "Category", render: (row) => <Badge variant="secondary">{row.category.replace("_", " ")}</Badge> },
    { key: "quantity", header: "Stock", sortable: true, render: (row) => (
      <span className={Number(row.quantity) <= Number(row.minStock) && Number(row.minStock) > 0 ? "text-destructive font-medium" : ""}>
        {Number(row.quantity)} {row.unit}
      </span>
    )},
    { key: "costPerUnit", header: "Cost/Unit", render: (row) => `₹${Number(row.costPerUnit).toFixed(2)}` },
    { key: "supplier", header: "Supplier", render: (row) => row.supplier || "—" },
  ];

  return (
    <>
      <PageHeader title="Raw Materials" description="Manage raw material inventory for production">
        <Button size="sm" onClick={() => openModal({ title: "Add Raw Material", size: "lg", content: <MaterialForm onSuccess={fetchMaterials} /> })}>Add Material</Button>
      </PageHeader>
      <DataTable
        data={materials}
        columns={columns}
        searchPlaceholder="Search materials..."
        actions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => openModal({ title: `Stock: ${row.name}`, content: <StockAdjust material={row} onSuccess={fetchMaterials} /> })}>Adjust</Button>
        )}
      />
    </>
  );
}
