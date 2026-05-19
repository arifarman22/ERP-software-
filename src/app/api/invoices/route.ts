import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getInvoices, createInvoice } from "@/lib/services/sales";
import { invoiceCreateSchema } from "@/lib/validators/sales";

export async function GET(req: NextRequest) {
  return withPermission("invoices:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const invoices = await getInvoices({
        dealerId: searchParams.get("dealerId") || undefined,
        status: searchParams.get("status") || undefined,
      });
      return successResponse(invoices);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("invoices:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = invoiceCreateSchema.parse(body);
      const invoice = await createInvoice(data, authReq.user.userId);
      return successResponse(invoice, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
