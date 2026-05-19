import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSales, createSale } from "@/lib/services/sales";
import { saleCreateSchema } from "@/lib/validators/sales";

export async function GET(req: NextRequest) {
  return withPermission("sales:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const sales = await getSales({
        dealerId: searchParams.get("dealerId") || undefined,
        status: searchParams.get("status") || undefined,
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
      });
      return successResponse(sales);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("sales:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = saleCreateSchema.parse(body);
      const sale = await createSale(data, authReq.user.userId);
      return successResponse(sale, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
