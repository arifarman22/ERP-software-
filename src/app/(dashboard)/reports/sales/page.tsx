"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { LineChart, BarChart, DonutChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { ReportControls } from "../report-controls";
import { TrendingUp, ShoppingCart, IndianRupee } from "lucide-react";

export default function SalesReportPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch(`/api/reports/sales?period=${period}`).then((r) => r.json()).then((j) => setData(j.data));
  }, [period]);

  if (!data) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const columns: Column<any>[] = [
    { key: "orderNumber", header: "Order", sortable: true, render: (r) => <span className="font-mono text-xs">{r.orderNumber}</span> },
    { key: "dealer", header: "Dealer", sortable: true },
    { key: "amount", header: "Amount", sortable: true, render: (r) => `₹${Number(r.amount).toLocaleString()}` },
    { key: "items", header: "Items" },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
    { key: "date", header: "Date", sortable: true, render: (r) => new Date(r.date).toLocaleDateString() },
  ];

  return (
    <>
      <PageHeader title="Sales Report">
        <ReportControls period={period} onPeriodChange={setPeriod} reportType="sales" />
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Orders" value={data.totalOrders} icon={ShoppingCart} />
        <StatCard title="Avg Order Value" value={`₹${Math.round(data.avgOrderValue).toLocaleString()}`} icon={IndianRupee} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LineChart title="Revenue Trend" data={data.byMonth.map((m: any) => ({ label: m.month.slice(5), value: m.revenue }))} className="lg:col-span-2" />
        <DonutChart title="Orders by Status" data={data.byStatus.map((s: any, i: number) => ({ label: s.status, value: s.count, color: ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"][i % 5] }))} />
      </div>

      <BarChart title="Top Products by Revenue" data={data.byProduct.map((p: any) => ({ label: p.name, value: Math.round(p.revenue) }))} />

      <DataTable data={data.orders} columns={columns} searchPlaceholder="Search orders..." pageSize={10} />
    </>
  );
}
