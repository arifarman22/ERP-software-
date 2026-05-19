"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { FileText, IndianRupee, AlertCircle, CheckCircle } from "lucide-react";
import { PaymentForm } from "./payment-form";

type Invoice = {
  id: string;
  invoiceNo: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  dealer: { companyName: string; dealerCode: string };
  sale: { orderNumber: string };
  _count: { payments: number };
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  PARTIALLY_PAID: "secondary",
  UNPAID: "outline",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { openModal } = useModal();

  async function fetchInvoices() {
    const res = await fetch("/api/invoices");
    const json = await res.json();
    setInvoices(json.data || []);
  }

  useEffect(() => { fetchInvoices(); }, []);

  const totalOutstanding = invoices
    .filter((i) => ["UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.totalAmount) - Number(i.paidAmount), 0);

  const totalCollected = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE" || (i.status !== "PAID" && new Date(i.dueDate) < new Date())).length;

  const columns: Column<Invoice>[] = [
    { key: "invoiceNo", header: "Invoice #", sortable: true, render: (row) => (
      <Link href={`/invoices/${row.id}`} className="font-mono text-xs text-primary hover:underline">{row.invoiceNo}</Link>
    )},
    { key: "dealer", header: "Dealer", sortable: true, render: (row) => row.dealer.companyName },
    { key: "totalAmount", header: "Total", sortable: true, render: (row) => `₹${Number(row.totalAmount).toLocaleString()}` },
    { key: "paidAmount", header: "Paid", render: (row) => `₹${Number(row.paidAmount).toLocaleString()}` },
    { key: "balance", header: "Balance", render: (row) => {
      const bal = Number(row.totalAmount) - Number(row.paidAmount);
      return <span className={bal > 0 ? "text-destructive font-medium" : "text-green-600"}>₹{bal.toLocaleString()}</span>;
    }},
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status]}>{row.status}</Badge> },
    { key: "dueDate", header: "Due Date", sortable: true, render: (row) => {
      const isOverdue = new Date(row.dueDate) < new Date() && row.status !== "PAID";
      return <span className={isOverdue ? "text-destructive" : ""}>{new Date(row.dueDate).toLocaleDateString()}</span>;
    }},
  ];

  return (
    <>
      <PageHeader title="Invoices" description="Track invoices, payments, and outstanding dues" />

      <StatGrid>
        <StatCard title="Total Invoices" value={invoices.length} icon={FileText} />
        <StatCard title="Collected" value={`₹${totalCollected.toLocaleString()}`} icon={CheckCircle} />
        <StatCard title="Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} icon={IndianRupee} className={totalOutstanding > 0 ? "border-yellow-500/50" : ""} />
        <StatCard title="Overdue" value={overdueCount} icon={AlertCircle} className={overdueCount > 0 ? "border-destructive/50" : ""} />
      </StatGrid>

      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoices..."
        pageSize={15}
        actions={(row) => (
          <div className="flex gap-1">
            {row.status !== "PAID" && row.status !== "CANCELLED" && (
              <Button variant="ghost" size="sm" onClick={() => openModal({
                title: `Payment — ${row.invoiceNo}`,
                description: `Balance: ₹${(Number(row.totalAmount) - Number(row.paidAmount)).toLocaleString()}`,
                content: <PaymentForm invoiceId={row.id} balance={Number(row.totalAmount) - Number(row.paidAmount)} onSuccess={fetchInvoices} />,
              })}>
                Pay
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => window.open(`/api/invoices/${row.id}/pdf`, "_blank")}>
              PDF
            </Button>
          </div>
        )}
      />
    </>
  );
}
