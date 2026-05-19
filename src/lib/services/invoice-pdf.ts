// Server-side PDF generation using HTML-to-PDF approach
// No external dependency — generates clean HTML that browsers render as PDF

type InvoiceData = {
  invoiceNo: string;
  createdAt: string;
  dueDate: string;
  dealer: { companyName: string; contactName: string; phone: string; email?: string | null; address?: string | null; gstNumber?: string | null };
  sale: { orderNumber: string; items: { product: { name: string; sku: string }; quantity: number; unitPrice: number; totalPrice: number }[] };
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  payments: { amount: number; method: string; paidAt: string; reference?: string | null }[];
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const balance = Number(data.totalAmount) - Number(data.paidAmount);
  const items = data.sale.items;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${data.invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
  .company { font-size: 24px; font-weight: bold; color: #16a34a; }
  .company-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 28px; color: #333; }
  .invoice-title p { color: #666; margin-top: 4px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .meta-box { background: #f8f9fa; padding: 16px; border-radius: 6px; width: 48%; }
  .meta-box h3 { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
  .meta-box p { margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #16a34a; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f9f9; }
  .totals { margin-left: auto; width: 280px; margin-top: 20px; }
  .totals tr td { padding: 6px 12px; border: none; }
  .totals .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #333; }
  .totals .balance { color: ${balance > 0 ? "#dc2626" : "#16a34a"}; }
  .payments { margin-top: 30px; }
  .payments h3 { font-size: 14px; margin-bottom: 10px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .badge-paid { background: #dcfce7; color: #16a34a; }
  .badge-unpaid { background: #fee2e2; color: #dc2626; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">🍃 Tea Estate ERP</div>
      <div class="company-sub">Premium Tea Packaging & Distribution</div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p><strong>${data.invoiceNo}</strong></p>
      <p>Order: ${data.sale.orderNumber}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h3>Bill To</h3>
      <p><strong>${data.dealer.companyName}</strong></p>
      <p>${data.dealer.contactName}</p>
      ${data.dealer.address ? `<p>${data.dealer.address}</p>` : ""}
      <p>${data.dealer.phone}</p>
      ${data.dealer.gstNumber ? `<p>GST: ${data.dealer.gstNumber}</p>` : ""}
    </div>
    <div class="meta-box">
      <h3>Invoice Details</h3>
      <p><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString("en-IN")}</p>
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString("en-IN")}</p>
      <p><strong>Status:</strong> <span class="badge ${balance <= 0 ? "badge-paid" : "badge-unpaid"}">${balance <= 0 ? "PAID" : "UNPAID"}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>SKU</th>
        <th style="text-align:right">Qty (kg)</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.product.name}</td>
        <td style="font-family:monospace">${item.product.sku}</td>
        <td style="text-align:right">${Number(item.quantity).toFixed(2)}</td>
        <td style="text-align:right">₹${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right">₹${Number(item.totalPrice).toFixed(2)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">₹${Number(data.subtotal).toFixed(2)}</td></tr>
    <tr><td>Tax (${Number(data.taxRate)}%)</td><td style="text-align:right">₹${Number(data.taxAmount).toFixed(2)}</td></tr>
    <tr class="total-row"><td>Total</td><td style="text-align:right">₹${Number(data.totalAmount).toFixed(2)}</td></tr>
    <tr><td>Paid</td><td style="text-align:right">₹${Number(data.paidAmount).toFixed(2)}</td></tr>
    <tr class="total-row balance"><td>Balance Due</td><td style="text-align:right">₹${balance.toFixed(2)}</td></tr>
  </table>

  ${data.payments.length > 0 ? `
  <div class="payments">
    <h3>Payment History</h3>
    <table>
      <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${data.payments.map((p) => `
        <tr>
          <td>${new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
          <td>${p.method}</td>
          <td>${p.reference || "—"}</td>
          <td style="text-align:right">₹${Number(p.amount).toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <p>Thank you for your business! | Payment terms: Net ${Math.ceil((new Date(data.dueDate).getTime() - new Date(data.createdAt).getTime()) / 86400000)} days</p>
    <p>Generated by Tea Estate ERP System</p>
  </div>
</body>
</html>`;
}
