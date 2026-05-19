import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getLowStockItems } from "@/lib/services/inventory";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const alerts = await getLowStockItems();
      return successResponse(alerts);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
