"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Dealer = {
  id: string;
  dealerCode: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  creditLimit: number;
  balance: number;
};

function DealerForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", email: "", address: "", gstNumber: "", creditLimit: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/dealers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Company Name *</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Contact Person *</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-2"><Label>GST Number</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
        <div className="space-y-2"><Label>Credit Limit (₹)</Label><Input type="number" value={form.creditLimit || ""} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Add Dealer"}</Button>
    </form>
  );
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const { openModal } = useModal();

  async function fetchDealers() {
    const res = await fetch("/api/dealers");
    const json = await res.json();
    setDealers(json.data || []);
  }

  useEffect(() => { fetchDealers(); }, []);

  const columns: Column<Dealer>[] = [
    { key: "dealerCode", header: "Code", sortable: true, render: (row) => <span className="font-mono text-xs">{row.dealerCode}</span> },
    { key: "companyName", header: "Company", sortable: true },
    { key: "contactName", header: "Contact" },
    { key: "phone", header: "Phone" },
    { key: "gstNumber", header: "GST", render: (row) => row.gstNumber || "—" },
    { key: "creditLimit", header: "Credit Limit", sortable: true, render: (row) => `₹${Number(row.creditLimit).toLocaleString()}` },
    { key: "balance", header: "Outstanding", sortable: true, render: (row) => (
      <span className={Number(row.balance) > 0 ? "text-destructive font-medium" : "text-green-600"}>
        ₹{Number(row.balance).toLocaleString()}
      </span>
    )},
  ];

  return (
    <>
      <PageHeader title="Dealers" description="Manage dealer accounts and credit">
        <Button size="sm" onClick={() => openModal({ title: "Add Dealer", size: "lg", content: <DealerForm onSuccess={fetchDealers} /> })}>
          Add Dealer
        </Button>
      </PageHeader>
      <DataTable data={dealers} columns={columns} searchPlaceholder="Search dealers..." pageSize={15} />
    </>
  );
}
