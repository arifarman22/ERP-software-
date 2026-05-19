import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getDealerReport } from "@/lib/services/reports";

export async function GET(req: NextRequest) {
  return withPermission("reports:view")(req, async () => {
    try {
      const period = (new URL(req.url).searchParams.get("period") || "30d") as any;
      return successResponse(await getDealerReport(period));
    } catch (error) { return errorResponse(error); }
  });
}
