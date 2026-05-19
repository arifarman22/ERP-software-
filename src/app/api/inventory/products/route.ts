import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getProducts, createProduct } from "@/lib/services/inventory";
import { productCreateSchema } from "@/lib/validators/inventory";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const products = await getProducts({
        category: searchParams.get("category") || undefined,
        search: searchParams.get("search") || undefined,
        active: searchParams.get("active") === "false" ? false : true,
      });
      return successResponse(products);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("inventory:create")(req, async () => {
    try {
      const body = await req.json();
      const data = productCreateSchema.parse(body);
      const product = await createProduct(data);
      return successResponse(product, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
