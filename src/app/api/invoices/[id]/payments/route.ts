import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { recordPayment } from "@/lib/services/sales";
import { paymentCreateSchema } from "@/lib/validators/sales";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  return withPermission("invoices:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const data = paymentCreateSchema.parse(body);
      const result = await recordPayment(id, data, authReq.user.userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
