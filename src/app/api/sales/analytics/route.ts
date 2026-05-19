import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSalesAnalytics } from "@/lib/services/sales";

export async function GET(req: NextRequest) {
  return withPermission("sales:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const period = (searchParams.get("period") || "30d") as "7d" | "30d" | "90d" | "1y";
      const analytics = await getSalesAnalytics(period);
      return successResponse(analytics);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
