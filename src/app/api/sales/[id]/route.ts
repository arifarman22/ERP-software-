import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSaleById, updateSaleStatus } from "@/lib/services/sales";
import { saleUpdateStatusSchema } from "@/lib/validators/sales";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withPermission("sales:view")(req, async () => {
    try {
      const { id } = await params;
      const sale = await getSaleById(id);
      if (!sale) return errorResponse(new Error("Sale not found"), 404);
      return successResponse(sale);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withPermission("sales:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { status } = saleUpdateStatusSchema.parse(body);
      const sale = await updateSaleStatus(id, status, authReq.user.userId);
      return successResponse(sale);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
