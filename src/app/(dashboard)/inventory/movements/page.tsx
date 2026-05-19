"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { MovementForm } from "./movement-form";

type Movement = {
  id: string;
  type: string;
  productId: string;
  quantity: number;
  batchNumber: string | null;
  reference: string | null;
  notes: string | null;
  fromWarehouse: { name: string; code: string } | null;
  toWarehouse: { name: string; code: string } | null;
  createdAt: string;
};

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  INBOUND: "default",
  OUTBOUND: "destructive",
  TRANSFER: "secondary",
  ADJUSTMENT: "outline",
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const { openModal } = useModal();

  async function fetchMovements() {
    const res = await fetch("/api/inventory/movements");
    const json = await res.json();
    setMovements(json.data || []);
  }

  useEffect(() => { fetchMovements(); }, []);

  const columns: Column<Movement>[] = [
    { key: "type", header: "Type", render: (row) => <Badge variant={typeColors[row.type]}>{row.type}</Badge> },
    { key: "from", header: "From", render: (row) => row.fromWarehouse?.name || "—" },
    { key: "to", header: "To", render: (row) => row.toWarehouse?.name || "—" },
    { key: "quantity", header: "Qty", sortable: true, render: (row) => `${Number(row.quantity).toFixed(1)} kg` },
    { key: "batchNumber", header: "Batch", render: (row) => row.batchNumber ? <span className="font-mono text-xs">{row.batchNumber}</span> : "—" },
    { key: "reference", header: "Reference", render: (row) => row.reference || row.notes || "—" },
    { key: "createdAt", header: "Date", sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <>
      <PageHeader title="Stock Movements" description="Track all inventory movements and transfers">
        <Button size="sm" onClick={() => openModal({ title: "New Movement", size: "lg", content: <MovementForm onSuccess={fetchMovements} /> })}>
          Record Movement
        </Button>
      </PageHeader>
      <DataTable data={movements} columns={columns} searchPlaceholder="Search movements..." pageSize={20} />
    </>
  );
}
