"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adjustmentSchema, type AdjustmentInput } from "@/lib/validators/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type InventoryItem = { id: string; quantity: number; product: { name: string; sku: string }; warehouse: { name: string } };

const REASONS = ["Physical Count Correction", "Damage/Spoilage", "Theft/Loss", "System Error Fix", "Quality Rejection", "Other"];

export function AdjustmentForm({ items, preselectedId, onSuccess }: { items: InventoryItem[]; preselectedId?: string; onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { inventoryItemId: preselectedId || "" },
  });

  const selectedId = watch("inventoryItemId");
  const selectedItem = items.find((i) => i.id === selectedId);

  async function onSubmit(data: AdjustmentInput) {
    setError("");
    const res = await fetch("/api/inventory/adjustments", {
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

      {!preselectedId && (
        <div className="space-y-2">
          <Label>Inventory Item *</Label>
          <Select onValueChange={(v) => setValue("inventoryItemId", v)}>
            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.product.name} — {item.warehouse.name} ({Number(item.quantity)} kg)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedItem && (
        <div className="p-3 rounded-md bg-muted text-sm">
          <p>Current Stock: <span className="font-semibold">{Number(selectedItem.quantity)} kg</span></p>
          <p className="text-muted-foreground">{selectedItem.product.name} @ {selectedItem.warehouse.name}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>New Quantity (kg) *</Label>
        <Input type="number" step="0.001" {...register("newQuantity")} placeholder="Enter corrected quantity" />
        {errors.newQuantity && <p className="text-xs text-destructive">{errors.newQuantity.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Reason *</Label>
        <Select onValueChange={(v) => setValue("reason", v)}>
          <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input {...register("notes")} placeholder="Additional details" />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adjusting..." : "Submit Adjustment"}
      </Button>
    </form>
  );
}
