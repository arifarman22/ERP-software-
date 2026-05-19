import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const exists = await db.user.findUnique({ where: { email: data.email } });
    if (exists) return errorResponse(new Error("Email already registered"), 409);

    const hashedPassword = await hash(data.password, 12);
    const user = await db.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword, role: data.role },
      select: { id: true, name: true, email: true, role: true },
    });

    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
