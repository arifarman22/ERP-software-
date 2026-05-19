import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { adjustInventory } from "@/lib/services/inventory";
import { adjustmentSchema } from "@/lib/validators/inventory";

export async function POST(req: NextRequest) {
  return withPermission("inventory:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = adjustmentSchema.parse(body);
      const result = await adjustInventory(data, authReq.user.userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
