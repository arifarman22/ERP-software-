import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getStockMovements, createStockMovement } from "@/lib/services/inventory";
import { stockMovementSchema } from "@/lib/validators/inventory";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const movements = await getStockMovements({
        productId: searchParams.get("productId") || undefined,
        type: searchParams.get("type") || undefined,
        limit: Number(searchParams.get("limit")) || 50,
      });
      return successResponse(movements);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("inventory:transfer")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = stockMovementSchema.parse(body);
      const movement = await createStockMovement(data, authReq.user.userId);
      return successResponse(movement, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
