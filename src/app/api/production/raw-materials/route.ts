import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getRawMaterials, createRawMaterial, updateRawMaterialStock } from "@/lib/services/production";
import { rawMaterialSchema, rawMaterialStockSchema } from "@/lib/validators/production";

export async function GET(req: NextRequest) {
  return withPermission("production:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const materials = await getRawMaterials({ category: searchParams.get("category") || undefined });
      return successResponse(materials);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("production:create")(req, async () => {
    try {
      const body = await req.json();
      const data = rawMaterialSchema.parse(body);
      const material = await createRawMaterial(data);
      return successResponse(material, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withPermission("production:edit")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = rawMaterialStockSchema.parse(body);
      const material = await updateRawMaterialStock(data, authReq.user.userId);
      return successResponse(material);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
