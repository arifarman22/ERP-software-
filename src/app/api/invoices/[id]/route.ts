import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getInvoiceById } from "@/lib/services/sales";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withPermission("invoices:view")(req, async () => {
    try {
      const { id } = await params;
      const invoice = await getInvoiceById(id);
      if (!invoice) return errorResponse(new Error("Invoice not found"), 404);
      return successResponse(invoice);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
