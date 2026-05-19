import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getInventoryItems } from "@/lib/services/inventory";
import { inventoryItemSchema } from "@/lib/validators/inventory";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const items = await getInventoryItems({
        warehouseId: searchParams.get("warehouseId") || undefined,
        productId: searchParams.get("productId") || undefined,
        lowStock: searchParams.get("lowStock") === "true",
      });
      return successResponse(items);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("inventory:create")(req, async () => {
    try {
      const body = await req.json();
      const data = inventoryItemSchema.parse(body);
      const item = await db.inventoryItem.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          batchId: data.batchId,
          quantity: data.quantity,
          costPerUnit: data.costPerUnit,
          minStock: data.minStock,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
        include: { product: true, warehouse: true },
      });
      return successResponse(item, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
