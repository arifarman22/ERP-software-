"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/dashboard/modal";
import { PaymentForm } from "../payment-form";
import { FileText, Printer } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const { openModal } = useModal();

  async function fetchInvoice() {
    const res = await fetch(`/api/invoices/${id}`);
    const json = await res.json();
    setInvoice(json.data);
  }

  useEffect(() => { fetchInvoice(); }, [id]);

  if (!invoice) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <>
      <PageHeader title={`Invoice ${invoice.invoiceNo}`} description={`Order: ${invoice.sale.orderNumber}`}>
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${id}/pdf`, "_blank")}>
          <Printer className="h-4 w-4 mr-1" /> Print / PDF
        </Button>
        {balance > 0 && (
          <Button size="sm" onClick={() => openModal({
            title: "Record Payment",
            content: <PaymentForm invoiceId={id} balance={balance} onSuccess={fetchInvoice} />,
          })}>
            Record Payment
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Line Items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.sale.items.map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{item.product.name}<br /><span className="text-xs text-muted-foreground font-mono">{item.product.sku}</span></td>
                      <td className="py-2 text-right">{Number(item.quantity)} kg</td>
                      <td className="py-2 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-2 text-right font-medium">₹{Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Payment History</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">₹{Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{p.method} {p.reference ? `• ${p.reference}` : ""}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={balance <= 0 ? "default" : "destructive"}>{invoice.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Number(invoice.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({Number(invoice.taxRate)}%)</span><span>₹{Number(invoice.taxAmount).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>₹{Number(invoice.totalAmount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="text-green-600">₹{Number(invoice.paidAmount).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2"><span>Balance</span><span className={balance > 0 ? "text-destructive" : "text-green-600"}>₹{balance.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <h4 className="font-semibold">Dealer</h4>
              <p>{invoice.dealer.companyName}</p>
              <p className="text-muted-foreground">{invoice.dealer.contactName}</p>
              <p className="text-muted-foreground">{invoice.dealer.phone}</p>
              {invoice.dealer.gstNumber && <p className="text-muted-foreground">GST: {invoice.dealer.gstNumber}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Invoice Date</span><span>{new Date(invoice.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
