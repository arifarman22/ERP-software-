"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ShoppingCart, Package, Store, Leaf, Users } from "lucide-react";

const reports = [
  { href: "/reports/sales", title: "Sales Report", description: "Revenue trends, top products, order analytics", icon: ShoppingCart, color: "text-green-600" },
  { href: "/reports/inventory", title: "Inventory Report", description: "Stock levels, warehouse distribution, low-stock alerts", icon: Package, color: "text-blue-600" },
  { href: "/reports/dealers", title: "Dealer Performance", description: "Revenue by dealer, outstanding dues, credit utilization", icon: Store, color: "text-purple-600" },
  { href: "/reports/production", title: "Production Analytics", description: "Batch yield, wastage analysis, output trends", icon: Leaf, color: "text-amber-600" },
  { href: "/reports/attendance", title: "Attendance Report", description: "Attendance rates, employee punctuality, trends", icon: Users, color: "text-pink-600" },
];

export default function ReportsOverview() {
  return (
    <>
      <PageHeader title="Reports & Analytics" description="Comprehensive business intelligence across all modules" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ href, title, description, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
