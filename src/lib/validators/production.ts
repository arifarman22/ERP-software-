import { z } from "zod";

// ─── Raw Materials ──────────────────────────────────────────────────────────

export const rawMaterialSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2).regex(/^[A-Z0-9-]+$/, "Code must be uppercase alphanumeric"),
  category: z.enum(["GREEN_LEAF", "DRIED_LEAF", "FLAVORING", "ADDITIVE", "PACKAGING_MATERIAL"]),
  unit: z.enum(["kg", "g", "liters", "pcs"]).default("kg"),
  quantity: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  costPerUnit: z.coerce.number().positive("Cost is required"),
  supplier: z.string().optional(),
});

export const rawMaterialStockSchema = z.object({
  id: z.string().min(1),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  type: z.enum(["ADD", "DEDUCT"]),
  reason: z.string().optional(),
});

// ─── Blend Recipes ──────────────────────────────────────────────────────────

export const blendRecipeSchema = z.object({
  name: z.string().min(2, "Recipe name is required"),
  code: z.string().min(2).regex(/^[A-Z0-9-]+$/, "Code must be uppercase"),
  description: z.string().optional(),
  outputProductId: z.string().min(1, "Output product is required"),
  targetYield: z.coerce.number().min(1).max(100).default(95),
  ingredients: z.array(z.object({
    rawMaterialId: z.string().min(1),
    percentage: z.coerce.number().min(0.1).max(100),
  })).min(1, "At least one ingredient required"),
});

// ─── Production Batches ─────────────────────────────────────────────────────

export const batchCreateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  recipeId: z.string().optional(),
  employeeId: z.string().min(1, "Assigned employee is required"),
  rawMaterialQty: z.coerce.number().positive("Raw material quantity required"),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
  materials: z.array(z.object({
    rawMaterialId: z.string().min(1),
    quantityUsed: z.coerce.number().positive(),
  })).optional(),
});

export const batchStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "CANCELLED"]),
  outputQty: z.coerce.number().min(0).optional(),
  endDate: z.string().optional(),
});

// ─── Packaging ──────────────────────────────────────────────────────────────

export const packagingSchema = z.object({
  batchId: z.string().min(1),
  packagingType: z.string().min(1, "Packaging type is required"),
  packagingQty: z.coerce.number().int().positive("Quantity must be positive"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  warehouseId: z.string().optional(),
});

// ─── Wastage ────────────────────────────────────────────────────────────────

export const wastageSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  employeeId: z.string().min(1, "Employee is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.enum(["kg", "g"]).default("kg"),
  reason: z.string().min(3, "Reason is required"),
  category: z.enum(["SPILLAGE", "CONTAMINATION", "QUALITY_REJECT", "MACHINE_ERROR", "EXPIRED", "OTHER"]),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type RawMaterialInput = z.infer<typeof rawMaterialSchema>;
export type RawMaterialStockInput = z.infer<typeof rawMaterialStockSchema>;
export type BlendRecipeInput = z.infer<typeof blendRecipeSchema>;
export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type BatchStatusInput = z.infer<typeof batchStatusSchema>;
export type PackagingInput = z.infer<typeof packagingSchema>;
export type WastageInput = z.infer<typeof wastageSchema>;
