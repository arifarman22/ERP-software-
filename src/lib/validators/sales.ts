import { z } from "zod";

// ─── Sales Orders ───────────────────────────────────────────────────────────

export const saleCreateSchema = z.object({
  dealerId: z.string().min(1, "Dealer is required"),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    inventoryItemId: z.string().min(1),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    unitPrice: z.coerce.number().positive("Price must be positive"),
  })).min(1, "At least one item is required"),
});

export const saleUpdateStatusSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"]),
});

// ─── Invoices ───────────────────────────────────────────────────────────────

export const invoiceCreateSchema = z.object({
  saleId: z.string().min(1, "Sale order is required"),
  taxRate: z.coerce.number().min(0).max(100).default(18),
  dueDate: z.string().min(1, "Due date is required"),
});

// ─── Payments ───────────────────────────────────────────────────────────────

export const paymentCreateSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "CREDIT"]),
  reference: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type SaleUpdateStatusInput = z.infer<typeof saleUpdateStatusSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
