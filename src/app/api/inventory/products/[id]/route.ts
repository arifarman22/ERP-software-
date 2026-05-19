import { NextRequest } from "next/server";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getProductById, updateProduct, deleteProduct } from "@/lib/services/inventory";
import { productUpdateSchema } from "@/lib/validators/inventory";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const { id } = await params;
      const product = await getProductById(id);
      if (!product) return errorResponse(new Error("Product not found"), 404);
      return successResponse(product);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withPermission("inventory:edit")(req, async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      const data = productUpdateSchema.parse({ ...body, id });
      const product = await updateProduct(data);
      return successResponse(product);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withPermission("inventory:edit")(req, async () => {
    try {
      const { id } = await params;
      await deleteProduct(id);
      return successResponse({ deleted: true });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
