"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { ReportControls } from "../report-controls";
import { Store, TrendingUp, AlertCircle } from "lucide-react";

export default function DealerReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch(`/api/reports/dealers?period=${period}`).then((r) => r.json()).then((j) => setData(j.data || []));
  }, [period]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOutstanding = data.reduce((s, d) => s + d.outstanding, 0);

  const columns: Column<any>[] = [
    { key: "name", header: "Company", sortable: true },
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "orders", header: "Orders", sortable: true },
    { key: "revenue", header: "Revenue", sortable: true, render: (r) => `₹${r.revenue.toLocaleString()}` },
    { key: "outstanding", header: "Outstanding", sortable: true, render: (r) => <span className={r.outstanding > 0 ? "text-destructive font-medium" : "text-green-600"}>₹{r.outstanding.toLocaleString()}</span> },
    { key: "overdueInvoices", header: "Overdue", render: (r) => r.overdueInvoices > 0 ? <Badge variant="destructive">{r.overdueInvoices}</Badge> : "0" },
    { key: "creditLimit", header: "Credit Limit", render: (r) => `₹${r.creditLimit.toLocaleString()}` },
  ];

  return (
    <>
      <PageHeader title="Dealer Performance">
        <ReportControls period={period} onPeriodChange={setPeriod} reportType="dealers" />
      </PageHeader>

      <StatGrid columns={3}>
        <StatCard title="Active Dealers" value={data.length} icon={Store} />
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} icon={AlertCircle} className={totalOutstanding > 0 ? "border-yellow-500/50" : ""} />
      </StatGrid>

      <BarChart title="Revenue by Dealer (Top 10)" data={data.slice(0, 10).map((d) => ({ label: d.name, value: Math.round(d.revenue) }))} />

      <DataTable data={data} columns={columns} searchPlaceholder="Search dealers..." pageSize={15} />
    </>
  );
}
