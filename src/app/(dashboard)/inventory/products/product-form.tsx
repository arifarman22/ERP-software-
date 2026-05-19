"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, type ProductCreateInput } from "@/lib/validators/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const CATEGORIES = ["Green Tea", "Black Tea", "White Tea", "Oolong", "Herbal", "Blended"];
const GRADES = ["SFTGFOP", "FTGFOP", "TGFOP", "FOP", "OP", "BOP", "CTC", "Dust"];

export function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: { unit: "kg" },
  });

  async function onSubmit(data: ProductCreateInput) {
    setError("");
    const res = await fetch("/api/inventory/products", {
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
          <Label>Product Name *</Label>
          <Input {...register("name")} placeholder="e.g. Darjeeling First Flush" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>SKU / Barcode *</Label>
          <Input {...register("sku")} placeholder="e.g. TEA-GRN-001" />
          {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select onValueChange={(v) => setValue("category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tea Grade</Label>
          <Select onValueChange={(v) => setValue("teaGrade", v)}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit Weight (kg) *</Label>
          <Input type="number" step="0.001" {...register("unitWeight")} />
          {errors.unitWeight && <p className="text-xs text-destructive">{errors.unitWeight.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Base Price (₹) *</Label>
          <Input type="number" step="0.01" {...register("basePrice")} />
          {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Input {...register("description")} placeholder="Optional product description" />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Product"}
      </Button>
    </form>
  );
}
