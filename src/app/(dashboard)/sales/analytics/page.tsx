"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { BarChart, LineChart, DonutChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendingUp, ShoppingCart, IndianRupee, AlertCircle } from "lucide-react";

type Analytics = {
  totalRevenue: number;
  salesCount: number;
  avgOrderValue: number;
  outstandingAmount: number;
  outstandingCount: number;
  topDealers: { name: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  monthlySales: { month: string; revenue: number; count: number }[];
};

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch(`/api/sales/analytics?period=${period}`)
      .then((r) => r.json())
      .then((json) => setData(json.data));
  }, [period]);

  if (!data) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <>
      <PageHeader title="Sales Analytics" description="Revenue insights and performance metrics">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Orders" value={data.salesCount} icon={ShoppingCart} />
        <StatCard title="Avg Order Value" value={`₹${Math.round(data.avgOrderValue).toLocaleString()}`} icon={IndianRupee} />
        <StatCard
          title="Outstanding Dues"
          value={`₹${data.outstandingAmount.toLocaleString()}`}
          icon={AlertCircle}
          description={`${data.outstandingCount} unpaid invoices`}
          className={data.outstandingAmount > 0 ? "border-yellow-500/50" : ""}
        />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LineChart
          title="Revenue Trend"
          data={data.monthlySales.map((m) => ({ label: m.month.slice(5), value: m.revenue }))}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Top Products by Revenue"
          data={data.topProducts.slice(0, 5).map((p, i) => ({
            label: p.name,
            value: Math.round(p.revenue),
            color: ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"][i],
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Top Dealers by Revenue"
          data={data.topDealers.map((d) => ({ label: d.name, value: Math.round(d.revenue) }))}
        />
        <BarChart
          title="Top Products by Quantity (kg)"
          data={data.topProducts.map((p) => ({ label: p.name, value: Math.round(p.quantity), color: "#3b82f6" }))}
        />
      </div>
    </>
  );
}
