"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { LineChart, BarChart, DonutChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { ReportControls } from "../report-controls";
import { Leaf, TrendingUp, Trash2, Activity } from "lucide-react";

export default function ProductionReportPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch(`/api/reports/production?period=${period}`).then((r) => r.json()).then((j) => setData(j.data));
  }, [period]);

  if (!data) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const columns: Column<any>[] = [
    { key: "batchNumber", header: "Batch", sortable: true, render: (r) => <span className="font-mono text-xs">{r.batchNumber}</span> },
    { key: "product", header: "Product" },
    { key: "employee", header: "Employee" },
    { key: "input", header: "Input (kg)", sortable: true },
    { key: "output", header: "Output (kg)", sortable: true },
    { key: "yield", header: "Yield", sortable: true, render: (r) => r.yield ? `${r.yield.toFixed(1)}%` : "—" },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
    { key: "date", header: "Date", sortable: true, render: (r) => new Date(r.date).toLocaleDateString() },
  ];

  return (
    <>
      <PageHeader title="Production Analytics">
        <ReportControls period={period} onPeriodChange={setPeriod} reportType="production" />
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Batches" value={data.totalBatches} icon={Activity} />
        <StatCard title="Total Output" value={`${data.totalOutput.toLocaleString()} kg`} icon={Leaf} />
        <StatCard title="Overall Yield" value={`${data.overallYield.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard title="Total Wastage" value={`${data.totalWastage.toFixed(1)} kg`} icon={Trash2} className={data.totalWastage > 0 ? "border-yellow-500/50" : ""} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LineChart title="Yield Trend" data={data.yieldTrend.map((y: any) => ({ label: y.month.slice(5), value: y.avgYield || 0 }))} className="lg:col-span-2" />
        <DonutChart title="Wastage by Category" data={data.wastageByCategory.map((w: any, i: number) => ({ label: w.category.replace("_", " "), value: Math.round(w.total), color: ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#6b7280", "#10b981"][i % 6] }))} />
      </div>

      <BarChart title="Output by Product" data={data.byProduct.map((p: any) => ({ label: p.product, value: Math.round(p.totalOutput) }))} />

      <DataTable data={data.batches} columns={columns} searchPlaceholder="Search batches..." pageSize={15} />
    </>
  );
}
