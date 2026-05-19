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

type Batch = { id: string; batchNumber: string; outputQty: number; status: string; packagingStatus: string; packagingType: string | null; packagingQty: number; product: { name: string } };

const PACKAGING_TYPES = ["100g Pouch", "250g Box", "500g Tin", "1kg Bag", "5kg Bulk", "Custom"];

function PackagingForm({ batch, onSuccess }: { batch: Batch; onSuccess: () => void }) {
  const [type, setType] = useState(batch.packagingType || "");
  const [qty, setQty] = useState(batch.packagingQty || 0);
  const [status, setStatus] = useState(batch.packagingStatus);
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/inventory/warehouses").then((r) => r.json()).then((json) => setWarehouses((json.data || []).map((w: any) => ({ id: w.id, name: w.name }))));
  }, []);

  async function handleSubmit() {
    setLoading(true); setError("");
    const res = await fetch("/api/production/packaging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch.id, packagingType: type, packagingQty: qty, status, warehouseId: status === "COMPLETED" ? warehouseId : undefined }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-sm">Batch: <span className="font-mono">{batch.batchNumber}</span> • Output: {Number(batch.outputQty)} kg</p>
      <div className="space-y-2">
        <Label>Packaging Type *</Label>
        <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{PACKAGING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="space-y-2"><Label>Number of Packages *</Label><Input type="number" value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} /></div>
      <div className="space-y-2">
        <Label>Status *</Label>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NOT_STARTED">Not Started</SelectItem><SelectItem value="IN_PROGRESS">In Progress</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem></SelectContent></Select>
      </div>
      {status === "COMPLETED" && (
        <div className="space-y-2">
          <Label>Destination Warehouse *</Label>
          <Select onValueChange={setWarehouseId}><SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger><SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
        </div>
      )}
      <Button onClick={handleSubmit} disabled={loading || !type || qty <= 0} className="w-full">{loading ? "Saving..." : "Update Packaging"}</Button>
    </div>
  );
}

export default function PackagingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const { openModal } = useModal();

  async function fetchBatches() {
    const res = await fetch("/api/production?status=COMPLETED");
    const json = await res.json();
    setBatches((json.data || []).filter((b: any) => b.status === "COMPLETED"));
  }

  useEffect(() => { fetchBatches(); }, []);

  const columns: Column<Batch>[] = [
    { key: "batchNumber", header: "Batch", sortable: true, render: (row) => <span className="font-mono text-xs">{row.batchNumber}</span> },
    { key: "product", header: "Product", render: (row) => row.product.name },
    { key: "outputQty", header: "Output", render: (row) => `${Number(row.outputQty)} kg` },
    { key: "packagingType", header: "Type", render: (row) => row.packagingType || "—" },
    { key: "packagingQty", header: "Packages", render: (row) => row.packagingQty || "—" },
    { key: "packagingStatus", header: "Status", render: (row) => (
      <Badge variant={row.packagingStatus === "COMPLETED" ? "default" : row.packagingStatus === "IN_PROGRESS" ? "secondary" : "outline"}>
        {row.packagingStatus.replace("_", " ")}
      </Badge>
    )},
  ];

  return (
    <>
      <PageHeader title="Packaging" description="Package completed batches and move to finished goods inventory" />
      <DataTable
        data={batches}
        columns={columns}
        searchPlaceholder="Search batches..."
        actions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => openModal({ title: "Packaging", content: <PackagingForm batch={row} onSuccess={fetchBatches} /> })}>
            {row.packagingStatus === "COMPLETED" ? "View" : "Package"}
          </Button>
        )}
      />
    </>
  );
}
