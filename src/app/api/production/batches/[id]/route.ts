import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getBatchById, updateBatchStatus } from "@/lib/services/production";
import { batchStatusSchema } from "@/lib/validators/production";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withPermission("production:view")(req, async () => {
    try {
      const { id } = await params;
      const batch = await getBatchById(id);
      if (!batch) return errorResponse(new Error("Batch not found"), 404);
      return successResponse(batch);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withPermission("production:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const data = batchStatusSchema.parse(body);
      const batch = await updateBatchStatus(id, data, authReq.user.userId);
      return successResponse(batch);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
