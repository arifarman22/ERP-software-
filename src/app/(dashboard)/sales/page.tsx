"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { ShoppingCart, FileText, TrendingUp, AlertCircle } from "lucide-react";

type Sale = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  saleDate: string;
  dealer: { companyName: string; dealerCode: string };
  items: any[];
  invoice: { invoiceNo: string; status: string; paidAmount: number; totalAmount: number } | null;
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  DISPATCHED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useModal();

  async function fetchSales() {
    setLoading(true);
    const res = await fetch("/api/sales");
    const json = await res.json();
    setSales(json.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchSales(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSales();
  }

  async function generateInvoice(saleId: string) {
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saleId, taxRate: 18, dueDate }),
    });
    if (res.ok) fetchSales();
    else {
      const json = await res.json();
      alert(json.error);
    }
  }

  const totalRevenue = sales.filter((s) => s.status !== "CANCELLED").reduce((sum, s) => sum + Number(s.netAmount), 0);
  const pendingOrders = sales.filter((s) => s.status === "DRAFT" || s.status === "CONFIRMED").length;

  const columns: Column<Sale>[] = [
    { key: "orderNumber", header: "Order #", sortable: true, render: (row) => <span className="font-mono text-xs">{row.orderNumber}</span> },
    { key: "dealer", header: "Dealer", sortable: true, render: (row) => row.dealer.companyName },
    { key: "items", header: "Items", render: (row) => row.items.length },
    { key: "netAmount", header: "Amount", sortable: true, render: (row) => `₹${Number(row.netAmount).toLocaleString()}` },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status]}>{row.status}</Badge> },
    { key: "invoice", header: "Invoice", render: (row) => row.invoice ? (
      <Link href={`/invoices/${row.invoice.invoiceNo}`} className="text-primary text-xs font-mono hover:underline">{row.invoice.invoiceNo}</Link>
    ) : <span className="text-muted-foreground text-xs">—</span> },
    { key: "saleDate", header: "Date", sortable: true, render: (row) => new Date(row.saleDate).toLocaleDateString() },
  ];

  return (
    <>
      <PageHeader title="Sales Orders" description="Manage dealer orders and track fulfillment">
        <Link href="/sales/analytics"><Button variant="outline" size="sm">Analytics</Button></Link>
        <Link href="/sales/new"><Button size="sm">New Order</Button></Link>
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Total Orders" value={sales.length} icon={ShoppingCart} />
        <StatCard title="Pending Orders" value={pendingOrders} icon={AlertCircle} />
        <StatCard title="Invoiced" value={sales.filter((s) => s.invoice).length} icon={FileText} />
      </StatGrid>

      <DataTable
        data={sales}
        columns={columns}
        searchPlaceholder="Search by order, dealer..."
        pageSize={15}
        actions={(row) => (
          <div className="flex gap-1">
            {row.status === "DRAFT" && (
              <Button variant="ghost" size="sm" onClick={() => updateStatus(row.id, "CONFIRMED")}>Confirm</Button>
            )}
            {row.status === "CONFIRMED" && !row.invoice && (
              <Button variant="ghost" size="sm" onClick={() => generateInvoice(row.id)}>Invoice</Button>
            )}
            {row.status === "CONFIRMED" && (
              <Button variant="ghost" size="sm" onClick={() => updateStatus(row.id, "DISPATCHED")}>Dispatch</Button>
            )}
            {row.status === "DISPATCHED" && (
              <Button variant="ghost" size="sm" onClick={() => updateStatus(row.id, "DELIVERED")}>Deliver</Button>
            )}
          </div>
        )}
      />
    </>
  );
}
