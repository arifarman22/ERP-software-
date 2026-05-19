"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Leaf, Activity, CheckCircle, TrendingUp } from "lucide-react";
import { BatchForm } from "./batches/batch-form";

type Batch = {
  id: string;
  batchNumber: string;
  rawMaterialQty: number;
  outputQty: number;
  expectedYield: number | null;
  actualYield: number | null;
  status: string;
  packagingStatus: string;
  startDate: string;
  endDate: string | null;
  product: { name: string; sku: string };
  recipe: { name: string } | null;
  employee: { user: { name: string } };
  _count: { wastages: number };
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  IN_PROGRESS: "secondary",
  QUALITY_CHECK: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export default function ProductionPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState({ activeBatches: 0, completedThisMonth: 0, totalOutputThisMonth: 0, avgYield: 0 });
  const { openModal } = useModal();

  async function fetchData() {
    const [batchRes, statsRes] = await Promise.all([
      fetch("/api/production").then((r) => r.json()),
      fetch("/api/production?stats=true").then((r) => r.json()),
    ]);
    setBatches(batchRes.data || []);
    if (statsRes.data) setStats(statsRes.data);
  }

  useEffect(() => { fetchData(); }, []);

  async function updateStatus(id: string, status: string, outputQty?: number) {
    await fetch(`/api/production/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, outputQty }),
    });
    fetchData();
  }

  const columns: Column<Batch>[] = [
    { key: "batchNumber", header: "Batch #", sortable: true, render: (row) => <span className="font-mono text-xs">{row.batchNumber}</span> },
    { key: "product", header: "Product", render: (row) => row.product.name },
    { key: "recipe", header: "Recipe", render: (row) => row.recipe?.name || "Manual" },
    { key: "rawMaterialQty", header: "Input", render: (row) => `${Number(row.rawMaterialQty)} kg` },
    { key: "outputQty", header: "Output", render: (row) => Number(row.outputQty) > 0 ? `${Number(row.outputQty)} kg` : "—" },
    { key: "yield", header: "Yield", render: (row) => row.actualYield ? `${Number(row.actualYield).toFixed(1)}%` : "—" },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status]}>{row.status.replace("_", " ")}</Badge> },
    { key: "packagingStatus", header: "Packaging", render: (row) => (
      <Badge variant={row.packagingStatus === "COMPLETED" ? "default" : "outline"}>
        {row.packagingStatus.replace("_", " ")}
      </Badge>
    )},
    { key: "employee", header: "Assigned", render: (row) => row.employee.user.name },
    { key: "startDate", header: "Started", sortable: true, render: (row) => new Date(row.startDate).toLocaleDateString() },
  ];

  return (
    <>
      <PageHeader title="Production Batches" description="Manage tea production from raw materials to finished goods">
        <Button size="sm" onClick={() => openModal({ title: "New Production Batch", size: "lg", content: <BatchForm onSuccess={fetchData} /> })}>
          New Batch
        </Button>
      </PageHeader>

      <StatGrid>
        <StatCard title="Active Batches" value={stats.activeBatches} icon={Activity} />
        <StatCard title="Completed (Month)" value={stats.completedThisMonth} icon={CheckCircle} />
        <StatCard title="Output (Month)" value={`${stats.totalOutputThisMonth.toLocaleString()} kg`} icon={Leaf} />
        <StatCard title="Avg Yield" value={`${stats.avgYield.toFixed(1)}%`} icon={TrendingUp} />
      </StatGrid>

      <DataTable
        data={batches}
        columns={columns}
        searchPlaceholder="Search batches..."
        pageSize={15}
        actions={(row) => (
          <div className="flex gap-1">
            {row.status === "PENDING" && <Button variant="ghost" size="sm" onClick={() => updateStatus(row.id, "IN_PROGRESS")}>Start</Button>}
            {row.status === "IN_PROGRESS" && <Button variant="ghost" size="sm" onClick={() => updateStatus(row.id, "QUALITY_CHECK")}>QC</Button>}
            {row.status === "QUALITY_CHECK" && (
              <Button variant="ghost" size="sm" onClick={() => {
                const qty = prompt("Enter output quantity (kg):");
                if (qty) updateStatus(row.id, "COMPLETED", Number(qty));
              }}>Complete</Button>
            )}
          </div>
        )}
      />
    </>
  );
}
