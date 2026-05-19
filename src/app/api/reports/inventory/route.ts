import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getInventoryReport } from "@/lib/services/reports";

export async function GET(req: NextRequest) {
  return withPermission("reports:view")(req, async () => {
    try { return successResponse(await getInventoryReport()); }
    catch (error) { return errorResponse(error); }
  });
}
