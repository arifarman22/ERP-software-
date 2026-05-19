import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getOutstandingDues } from "@/lib/services/sales";

export async function GET(req: NextRequest) {
  return withPermission("invoices:view")(req, async () => {
    try {
      const dues = await getOutstandingDues();
      return successResponse(dues);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
