import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/api-response";
import { getInvoiceById } from "@/lib/services/sales";
import { generateInvoiceHTML } from "@/lib/services/invoice-pdf";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withPermission("invoices:view")(req, async () => {
    try {
      const { id } = await params;
      const invoice = await getInvoiceById(id);
      if (!invoice) return errorResponse(new Error("Invoice not found"), 404);

      const html = generateInvoiceHTML({
        invoiceNo: invoice.invoiceNo,
        createdAt: invoice.createdAt.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        dealer: invoice.dealer as any,
        sale: {
          orderNumber: invoice.sale.orderNumber,
          items: invoice.sale.items.map((i) => ({
            product: i.product,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
        },
        subtotal: Number(invoice.subtotal),
        taxRate: Number(invoice.taxRate),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        payments: invoice.payments.map((p) => ({
          amount: Number(p.amount),
          method: p.method,
          paidAt: p.paidAt.toISOString(),
          reference: p.reference,
        })),
      });

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="${invoice.invoiceNo}.html"`,
        },
      });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
