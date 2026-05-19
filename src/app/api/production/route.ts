import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getBatches, createBatch, getProductionStats } from "@/lib/services/production";
import { batchCreateSchema } from "@/lib/validators/production";

export async function GET(req: NextRequest) {
  return withPermission("production:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      if (searchParams.get("stats") === "true") {
        return successResponse(await getProductionStats());
      }
      const batches = await getBatches({
        status: searchParams.get("status") || undefined,
        productId: searchParams.get("productId") || undefined,
      });
      return successResponse(batches);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("production:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = batchCreateSchema.parse(body);
      const batch = await createBatch(data, authReq.user.userId);
      return successResponse(batch, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
