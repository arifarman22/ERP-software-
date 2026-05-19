"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/inventory", label: "Overview" },
  { href: "/inventory/products", label: "Products" },
  { href: "/inventory/warehouses", label: "Warehouses" },
  { href: "/inventory/movements", label: "Movements" },
  { href: "/inventory/alerts", label: "Alerts" },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/inventory" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
