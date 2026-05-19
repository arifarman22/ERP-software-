import { z } from "zod";

// ─── Products ───────────────────────────────────────────────────────────────

export const productCreateSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(3, "SKU must be at least 3 characters").regex(/^[A-Z0-9-]+$/, "SKU must be uppercase alphanumeric"),
  category: z.string().min(1, "Category is required"),
  teaGrade: z.string().optional(),
  description: z.string().optional(),
  unitWeight: z.coerce.number().positive("Unit weight must be positive"),
  unit: z.enum(["kg", "g", "pcs", "boxes"]).default("kg"),
  basePrice: z.coerce.number().positive("Base price must be positive"),
  barcode: z.string().optional(),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().min(1),
});

// ─── Warehouses ─────────────────────────────────────────────────────────────

export const warehouseCreateSchema = z.object({
  name: z.string().min(2, "Warehouse name is required"),
  code: z.string().min(2).regex(/^[A-Z0-9-]+$/, "Code must be uppercase alphanumeric"),
  address: z.string().min(5, "Address is required"),
  capacity: z.coerce.number().positive().optional(),
});

export const warehouseUpdateSchema = warehouseCreateSchema.partial().extend({
  id: z.string().min(1),
});

// ─── Inventory Items ────────────────────────────────────────────────────────

export const inventoryItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  batchId: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  costPerUnit: z.coerce.number().positive("Cost must be positive"),
  minStock: z.coerce.number().min(0).default(0),
  expiryDate: z.string().optional(),
});

// ─── Stock Movements ────────────────────────────────────────────────────────

export const stockMovementSchema = z.object({
  type: z.enum(["INBOUND", "OUTBOUND", "TRANSFER", "ADJUSTMENT"]),
  productId: z.string().min(1, "Product is required"),
  fromWarehouseId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  batchNumber: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.type === "TRANSFER") return data.fromWarehouseId && data.toWarehouseId;
  if (data.type === "INBOUND") return data.toWarehouseId;
  if (data.type === "OUTBOUND") return data.fromWarehouseId;
  return true;
}, { message: "Warehouse selection invalid for movement type" });

// ─── Inventory Adjustment ───────────────────────────────────────────────────

export const adjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  newQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  reason: z.string().min(3, "Reason is required"),
  notes: z.string().optional(),
});

// ─── Barcode Lookup ─────────────────────────────────────────────────────────

export const barcodeLookupSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
});

export const barcodeAssignSchema = z.object({
  productId: z.string().min(1),
  barcode: z.string().min(8, "Barcode must be at least 8 characters"),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdateInput = z.infer<typeof warehouseUpdateSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
export type BarcodeAssignInput = z.infer<typeof barcodeAssignSchema>;
