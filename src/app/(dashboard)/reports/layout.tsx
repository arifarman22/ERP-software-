"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/reports", label: "Overview" },
  { href: "/reports/sales", label: "Sales" },
  { href: "/reports/inventory", label: "Inventory" },
  { href: "/reports/dealers", label: "Dealers" },
  { href: "/reports/production", label: "Production" },
  { href: "/reports/attendance", label: "Attendance" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(({ href, label }) => (
          <Link key={href} href={href} className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
            (pathname === href || (href !== "/reports" && pathname.startsWith(href)))
              ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}>{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
