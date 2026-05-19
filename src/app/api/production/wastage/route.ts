import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { recordWastage, getWastageSummary } from "@/lib/services/production";
import { wastageSchema } from "@/lib/validators/production";

export async function GET(req: NextRequest) {
  return withPermission("production:view")(req, async () => {
    try {
      return successResponse(await getWastageSummary());
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("production:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = wastageSchema.parse(body);
      const wastage = await recordWastage(data, authReq.user.userId);
      return successResponse(wastage, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
