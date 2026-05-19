"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/schemas";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewEmployeePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
  });

  async function onSubmit(data: EmployeeInput) {
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/employees");
  }

  return (
    <>
      <PageHeader title="Add Employee" description="Create a new employee account" />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input {...register("name")} placeholder="John Doe" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" {...register("email")} placeholder="john@teaestate.erp" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Input {...register("department")} placeholder="e.g. Production, Packaging" />
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Designation *</Label>
                <Input {...register("designation")} placeholder="e.g. Tea Blender, Operator" />
                {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="+91 9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Salary (₹) *</Label>
                <Input type="number" {...register("salary")} placeholder="25000" />
                {errors.salary && <p className="text-xs text-destructive">{errors.salary.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input {...register("address")} placeholder="Full address" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Employee"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/employees")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
