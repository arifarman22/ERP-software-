import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EmployeesPage() {
  const employees = await db.employee.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employees</h1>
        <Link href="/employees/new">
          <Button>Add Employee</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <Card key={emp.id}>
            <CardHeader>
              <CardTitle>{emp.user.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>ID: {emp.employeeCode}</p>
              <p>Department: {emp.department}</p>
              <p>Designation: {emp.designation}</p>
              <p>Salary: ${emp.salary.toLocaleString()}</p>
              <p className={emp.isActive ? "text-green-600" : "text-red-600"}>
                {emp.isActive ? "Active" : "Inactive"}
              </p>
            </CardContent>
          </Card>
        ))}
        {employees.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-10">
            No employees found.
          </p>
        )}
      </div>
    </div>
  );
}
