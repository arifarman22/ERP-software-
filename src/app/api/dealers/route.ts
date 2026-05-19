import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const dealerCreateSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  return withPermission("dealers:view")(req, async () => {
    try {
      const dealers = await db.dealer.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { companyName: "asc" },
      });
      return successResponse(dealers);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("dealers:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = dealerCreateSchema.parse(body);

      const dealerCode = `DLR-${Date.now().toString(36).toUpperCase()}`;
      const dealer = await db.dealer.create({
        data: { ...data, dealerCode },
      });

      await db.auditLog.create({
        data: { userId: authReq.user.userId, action: "CREATE", entity: "Dealer", entityId: dealer.id, newData: dealer as any },
      });

      return successResponse(dealer, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
