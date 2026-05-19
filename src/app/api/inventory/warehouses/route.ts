import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getWarehouses, createWarehouse } from "@/lib/services/inventory";
import { warehouseCreateSchema } from "@/lib/validators/inventory";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const warehouses = await getWarehouses();
      return successResponse(warehouses);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("inventory:create")(req, async () => {
    try {
      const body = await req.json();
      const data = warehouseCreateSchema.parse(body);
      const warehouse = await createWarehouse(data);
      return successResponse(warehouse, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
