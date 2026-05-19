"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/production", label: "Batches" },
  { href: "/production/raw-materials", label: "Raw Materials" },
  { href: "/production/recipes", label: "Blend Recipes" },
  { href: "/production/packaging", label: "Packaging" },
  { href: "/production/wastage", label: "Wastage" },
];

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/production" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
