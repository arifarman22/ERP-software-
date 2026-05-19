"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { batchCreateSchema, type BatchCreateInput } from "@/lib/validators/production";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type Option = { id: string; name: string };

export function BatchForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Option[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [materials, setMaterials] = useState<Option[]>([]);
  const [materialRows, setMaterialRows] = useState<{ rawMaterialId: string; quantityUsed: number }[]>([]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<BatchCreateInput>({
    resolver: zodResolver(batchCreateSchema),
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/products").then((r) => r.json()),
      fetch("/api/production/recipes").then((r) => r.json()),
      fetch("/api/production/raw-materials").then((r) => r.json()),
    ]).then(([p, r, m]) => {
      setProducts((p.data || []).map((x: any) => ({ id: x.id, name: x.name })));
      setRecipes(r.data || []);
      setMaterials((m.data || []).map((x: any) => ({ id: x.id, name: `${x.name} (${Number(x.quantity)} ${x.unit})` })));
      // Mock employees — in production fetch from /api/employees
      setEmployees([{ id: "emp1", name: "Production Team" }]);
    });
  }, []);

  function addMaterial() {
    setMaterialRows([...materialRows, { rawMaterialId: "", quantityUsed: 0 }]);
  }

  function removeMaterial(i: number) {
    setMaterialRows(materialRows.filter((_, idx) => idx !== i));
  }

  function updateMaterial(i: number, field: string, value: any) {
    const updated = [...materialRows];
    (updated[i] as any)[field] = value;
    setMaterialRows(updated);
  }

  async function onSubmit(data: BatchCreateInput) {
    setError("");
    const payload = { ...data, materials: materialRows.length > 0 ? materialRows : undefined };
    const res = await fetch("/api/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
          <Label>Output Product *</Label>
          <Select onValueChange={(v) => setValue("productId", v)}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Blend Recipe</Label>
          <Select onValueChange={(v) => setValue("recipeId", v)}>
            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>{recipes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Assigned Employee *</Label>
          <Select onValueChange={(v) => setValue("employeeId", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Raw Material Qty (kg) *</Label>
          <Input type="number" step="0.001" {...register("rawMaterialQty")} />
          {errors.rawMaterialQty && <p className="text-xs text-destructive">{errors.rawMaterialQty.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input {...register("notes")} placeholder="Optional" />
        </div>
      </div>

      {/* Material consumption */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Raw Material Consumption</Label>
          <Button type="button" variant="outline" size="sm" onClick={addMaterial}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        {materialRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={row.rawMaterialId} onValueChange={(v) => updateMaterial(i, "rawMaterialId", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Material" /></SelectTrigger>
                <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input type="number" step="0.001" className="w-28 h-8 text-xs" placeholder="Qty (kg)" value={row.quantityUsed || ""} onChange={(e) => updateMaterial(i, "quantityUsed", Number(e.target.value))} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMaterial(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Batch"}
      </Button>
    </form>
  );
}
