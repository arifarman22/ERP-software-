import { NextRequest } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getBlendRecipes, createBlendRecipe } from "@/lib/services/production";
import { blendRecipeSchema } from "@/lib/validators/production";

export async function GET(req: NextRequest) {
  return withPermission("production:view")(req, async () => {
    try {
      return successResponse(await getBlendRecipes());
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission("production:create")(req, async () => {
    try {
      const body = await req.json();
      const data = blendRecipeSchema.parse(body);
      const recipe = await createBlendRecipe(data);
      return successResponse(recipe, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
