"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentCreateSchema, type PaymentCreateInput } from "@/lib/validators/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT", label: "Credit Note" },
];

export function PaymentForm({ invoiceId, balance, onSuccess }: { invoiceId: string; balance: number; onSuccess: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PaymentCreateInput>({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: { amount: balance },
  });

  async function onSubmit(data: PaymentCreateInput) {
    setError("");
    if (data.amount > balance) { setError("Amount exceeds balance"); return; }

    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="p-3 rounded-md bg-muted text-sm">
        <p>Outstanding Balance: <span className="font-semibold text-destructive">₹{balance.toLocaleString()}</span></p>
      </div>

      <div className="space-y-2">
        <Label>Amount (₹) *</Label>
        <Input type="number" step="0.01" {...register("amount")} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Payment Method *</Label>
        <Select onValueChange={(v) => setValue("method", v as any)}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Reference / Transaction ID</Label>
        <Input {...register("reference")} placeholder="e.g. UTR number, cheque no." />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Processing..." : `Record Payment — ₹${balance.toLocaleString()}`}
      </Button>
    </form>
  );
}
