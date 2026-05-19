"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockMovementSchema, type StockMovementInput } from "@/lib/validators/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Option = { id: string; name: string };

export function MovementForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [movementType, setMovementType] = useState<string>("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<StockMovementInput>({
    resolver: zodResolver(stockMovementSchema),
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/products").then((r) => r.json()),
      fetch("/api/inventory/warehouses").then((r) => r.json()),
    ]).then(([p, w]) => {
      setProducts((p.data || []).map((x: any) => ({ id: x.id, name: `${x.name} (${x.sku})` })));
      setWarehouses((w.data || []).map((x: any) => ({ id: x.id, name: `${x.name} (${x.code})` })));
    });
  }, []);

  async function onSubmit(data: StockMovementInput) {
    setError("");
    const res = await fetch("/api/inventory/movements", {
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

      <div className="space-y-2">
        <Label>Movement Type *</Label>
        <Select onValueChange={(v) => { setValue("type", v as any); setMovementType(v); }}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="INBOUND">Inbound (Stock In)</SelectItem>
            <SelectItem value="OUTBOUND">Outbound (Stock Out)</SelectItem>
            <SelectItem value="TRANSFER">Transfer Between Warehouses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Product *</Label>
        <Select onValueChange={(v) => setValue("productId", v)}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(movementType === "OUTBOUND" || movementType === "TRANSFER") && (
          <div className="space-y-2">
            <Label>From Warehouse *</Label>
            <Select onValueChange={(v) => setValue("fromWarehouseId", v)}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {(movementType === "INBOUND" || movementType === "TRANSFER") && (
          <div className="space-y-2">
            <Label>To Warehouse *</Label>
            <Select onValueChange={(v) => setValue("toWarehouseId", v)}>
              <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Quantity (kg) *</Label>
          <Input type="number" step="0.001" {...register("quantity")} />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Batch Number</Label>
          <Input {...register("batchNumber")} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reference / Notes</Label>
        <Input {...register("notes")} placeholder="e.g. PO-2024-001, Supplier delivery" />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Processing..." : "Record Movement"}
      </Button>
    </form>
  );
}
