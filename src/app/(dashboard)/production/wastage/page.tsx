"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatGrid, StatCard } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wastageSchema, type WastageInput } from "@/lib/validators/production";

type WastageSummary = { category: string; total: number; count: number };

const CATEGORIES = ["SPILLAGE", "CONTAMINATION", "QUALITY_REJECT", "MACHINE_ERROR", "EXPIRED", "OTHER"];
const categoryColors: Record<string, string> = {
  SPILLAGE: "#f59e0b", CONTAMINATION: "#ef4444", QUALITY_REJECT: "#8b5cf6",
  MACHINE_ERROR: "#3b82f6", EXPIRED: "#6b7280", OTHER: "#10b981",
};

function WastageForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<{ id: string; batchNumber: string }[]>([]);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<WastageInput>({
    resolver: zodResolver(wastageSchema),
    defaultValues: { unit: "kg" },
  });

  useEffect(() => {
    fetch("/api/production").then((r) => r.json()).then((json) => {
      setBatches((json.data || []).filter((b: any) => b.status !== "CANCELLED").map((b: any) => ({ id: b.id, batchNumber: b.batchNumber })));
    });
  }, []);

  async function onSubmit(data: WastageInput) {
    setError("");
    const res = await fetch("/api/production/wastage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { setError((await res.json()).error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Batch *</Label>
        <Select onValueChange={(v) => setValue("batchId", v)}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber}</SelectItem>)}</SelectContent></Select>
        {errors.batchId && <p className="text-xs text-destructive">{errors.batchId.message}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Quantity *</Label><Input type="number" step="0.001" {...register("quantity")} />{errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}</div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select onValueChange={(v) => setValue("category", v as any)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Reason *</Label><Input {...register("reason")} placeholder="Describe what happened" />{errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}</div>
      <div className="space-y-2"><Label>Employee ID *</Label><Input {...register("employeeId")} placeholder="Employee who reported" /></div>
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Recording..." : "Record Wastage"}</Button>
    </form>
  );
}

export default function WastagePage() {
  const [summary, setSummary] = useState<WastageSummary[]>([]);
  const { openModal } = useModal();

  async function fetchData() {
    const res = await fetch("/api/production/wastage");
    const json = await res.json();
    setSummary(json.data || []);
  }

  useEffect(() => { fetchData(); }, []);

  const totalWastage = summary.reduce((sum, s) => sum + s.total, 0);
  const totalIncidents = summary.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <PageHeader title="Wastage Tracking" description="Monitor and reduce production waste">
        <Button size="sm" onClick={() => openModal({ title: "Record Wastage", content: <WastageForm onSuccess={fetchData} /> })}>Report Wastage</Button>
      </PageHeader>

      <StatGrid columns={3}>
        <StatCard title="Total Wastage (30d)" value={`${totalWastage.toFixed(1)} kg`} icon={Trash2} />
        <StatCard title="Incidents" value={totalIncidents} icon={AlertTriangle} />
        <StatCard title="Categories" value={summary.length} icon={AlertTriangle} />
      </StatGrid>

      <BarChart
        title="Wastage by Category (Last 30 Days)"
        data={summary.map((s) => ({ label: s.category.replace("_", " "), value: Math.round(s.total), color: categoryColors[s.category] }))}
      />

      {summary.length === 0 && <p className="text-center text-muted-foreground py-10">No wastage recorded in the last 30 days.</p>}
    </>
  );
}
