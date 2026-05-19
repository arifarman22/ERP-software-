import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updatePackaging } from "@/lib/services/production";
import { packagingSchema } from "@/lib/validators/production";

export async function POST(req: NextRequest) {
  return withPermission("production:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = packagingSchema.parse(body);
      const result = await updatePackaging(data, authReq.user.userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
