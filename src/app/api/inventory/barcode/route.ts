import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { lookupByBarcode, assignBarcode } from "@/lib/services/inventory";
import { barcodeLookupSchema, barcodeAssignSchema } from "@/lib/validators/inventory";

export async function GET(req: NextRequest) {
  return withPermission("inventory:view")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const { barcode } = barcodeLookupSchema.parse({ barcode: searchParams.get("code") });
      const product = await lookupByBarcode(barcode);
      if (!product) return errorResponse(new Error("Product not found for barcode"), 404);
      return successResponse(product);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("inventory:edit")(req, async () => {
    try {
      const body = await req.json();
      const data = barcodeAssignSchema.parse(body);
      const product = await assignBarcode(data);
      return successResponse(product);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
