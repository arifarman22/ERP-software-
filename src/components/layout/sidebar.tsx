"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Leaf,
  Package,
  ShoppingCart,
  FileText,
  Store,
  BarChart3,
  ChevronLeft,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions: string[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: ["dashboard:view"] },
  { href: "/employees", label: "Employees", icon: Users, permissions: ["employees:view"] },
  { href: "/production", label: "Production", icon: Leaf, permissions: ["production:view"] },
  { href: "/inventory", label: "Inventory", icon: Package, permissions: ["inventory:view"] },
  { href: "/sales", label: "Sales", icon: ShoppingCart, permissions: ["sales:view"] },
  { href: "/invoices", label: "Invoices", icon: FileText, permissions: ["invoices:view"] },
  { href: "/dealers", label: "Dealers", icon: Store, permissions: ["dealers:view"] },
  { href: "/reports", label: "Reports", icon: BarChart3, permissions: ["reports:view"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userPermissions = user?.permissions ?? [];
  const visibleItems = navItems.filter((item) =>
    item.permissions.some((p) => userPermissions.includes(p))
  );

  const navContent = (
    <>
      <div className={cn("flex items-center border-b", collapsed ? "justify-center p-4" : "justify-between p-6")}>
        {!collapsed && <h1 className="text-lg font-bold text-primary">🍃 Tea Estate ERP</h1>}
        {collapsed && <span className="text-lg">🍃</span>}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r transform transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
