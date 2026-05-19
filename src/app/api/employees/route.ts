import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/index";
import { employeeSchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hash } from "bcryptjs";

export async function GET(req: NextRequest) {
  return withPermission("employees:view")(req, async () => {
    const employees = await db.employee.findMany({
      where: { deletedAt: null },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(employees);
  });
}

export async function POST(req: NextRequest) {
  return withPermission("employees:create")(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = employeeSchema.parse(body);

      const hashedPassword = await hash("default123", 12);
      const user = await db.user.create({
        data: { name: data.name, email: data.email, password: hashedPassword, role: "WORKER", phone: data.phone },
      });

      const employeeCode = `EMP-${Date.now().toString(36).toUpperCase()}`;
      const employee = await db.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          department: data.department,
          designation: data.designation,
          address: data.address,
          salary: data.salary,
        },
        include: { user: { select: { name: true, email: true } } },
      });

      await db.auditLog.create({
        data: {
          userId: authReq.user.userId,
          action: "CREATE",
          entity: "Employee",
          entityId: employee.id,
          newData: employee as any,
          ipAddress: req.headers.get("x-forwarded-for"),
        },
      });

      return successResponse(employee, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
