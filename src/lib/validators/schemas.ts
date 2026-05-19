import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  salary: z.coerce.number().positive("Salary must be positive"),
});

export const productionSchema = z.object({
  teaType: z.string().min(1, "Tea type is required"),
  quantity: z.coerce.number().positive(),
  employeeId: z.string().min(1, "Employee is required"),
  harvestDate: z.string().min(1, "Harvest date is required"),
  notes: z.string().optional(),
});

export const inventorySchema = z.object({
  productName: z.string().min(1),
  teaGrade: z.string().min(1),
  quantity: z.coerce.number().positive(),
  warehouse: z.string().min(1),
  costPerUnit: z.coerce.number().positive(),
  minStock: z.coerce.number().min(0).optional(),
  productionId: z.string().optional(),
});

export const saleSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  items: z.array(
    z.object({
      inventoryId: z.string().min(1),
      quantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().positive(),
    })
  ).min(1, "At least one item is required"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type ProductionInput = z.infer<typeof productionSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type SaleInput = z.infer<typeof saleSchema>;
