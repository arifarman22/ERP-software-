import { NextRequest } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "tea-erp";

      if (!file) return errorResponse(new Error("No file provided"), 400);
      if (!file.type.startsWith("image/")) return errorResponse(new Error("Only images allowed"), 400);
      if (file.size > 5 * 1024 * 1024) return errorResponse(new Error("File too large (max 5MB)"), 400);

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadImage(buffer, { folder });

      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { publicId } = await req.json();
      if (!publicId) return errorResponse(new Error("publicId required"), 400);

      const deleted = await deleteImage(publicId);
      return successResponse({ deleted });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
