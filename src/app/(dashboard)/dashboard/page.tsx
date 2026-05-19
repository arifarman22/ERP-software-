"use client";

import { useAuth } from "@/hooks/use-auth";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { BarChart, DonutChart, LineChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useModal } from "@/components/dashboard/modal";
import { Users, Leaf, Package, ShoppingCart, TrendingUp, AlertTriangle, Clock, FileText } from "lucide-react";

// ─── Role-specific dashboard components ─────────────────────────────────────

function AdminDashboard() {
  const { openModal } = useModal();

  return (
    <>
      <StatGrid>
        <StatCard title="Total Employees" value="48" icon={Users} trend={{ value: 4.5, label: "from last month" }} />
        <StatCard title="Production (Month)" value="3,000 kg" icon={Leaf} trend={{ value: 12, label: "vs last month" }} />
        <StatCard title="Inventory Value" value="₹12.4L" icon={Package} description="Across 4 warehouses" />
        <StatCard title="Revenue (MTD)" value="₹8.2L" icon={TrendingUp} trend={{ value: -2.3, label: "vs last month" }} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LineChart title="Weekly Production Output (kg)" data={[
          { label: "Mon", value: 180 }, { label: "Tue", value: 220 }, { label: "Wed", value: 195 },
          { label: "Thu", value: 260 }, { label: "Fri", value: 240 }, { label: "Sat", value: 310 }, { label: "Sun", value: 150 },
        ]} className="lg:col-span-2" />
        <DonutChart title="Production by Tea Type" data={[
          { label: "Green Tea", value: 1250, color: "#22c55e" }, { label: "Black Tea", value: 980, color: "#3b82f6" },
          { label: "White Tea", value: 450, color: "#a855f7" }, { label: "Oolong", value: 320, color: "#f59e0b" },
        ]} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart title="Inventory by Warehouse (kg)" data={[
          { label: "Warehouse A", value: 4500 }, { label: "Warehouse B", value: 3200 },
          { label: "Warehouse C", value: 2100 }, { label: "Warehouse D", value: 1800 },
        ]} />
        <BarChart title="Top Dealers by Revenue" data={[
          { label: "ABC Traders", value: 245000 }, { label: "XYZ Corp", value: 198000 },
          { label: "Tea House Ltd", value: 156000 }, { label: "Green Leaf Co", value: 132000 },
        ]} />
      </div>
    </>
  );
}

function ManagerDashboard() {
  return (
    <>
      <StatGrid>
        <StatCard title="Pending Orders" value="12" icon={ShoppingCart} />
        <StatCard title="Production (Month)" value="3,000 kg" icon={Leaf} trend={{ value: 12, label: "vs last month" }} />
        <StatCard title="Low Stock Items" value="5" icon={AlertTriangle} className="border-yellow-500/50" />
        <StatCard title="Revenue (MTD)" value="₹8.2L" icon={TrendingUp} trend={{ value: -2.3, label: "vs last month" }} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChart title="Sales Trend (Last 7 Days)" data={[
          { label: "Mon", value: 45000 }, { label: "Tue", value: 62000 }, { label: "Wed", value: 38000 },
          { label: "Thu", value: 71000 }, { label: "Fri", value: 55000 }, { label: "Sat", value: 82000 }, { label: "Sun", value: 29000 },
        ]} />
        <DonutChart title="Order Status" data={[
          { label: "Delivered", value: 24, color: "#22c55e" }, { label: "Dispatched", value: 8, color: "#3b82f6" },
          { label: "Confirmed", value: 12, color: "#f59e0b" }, { label: "Draft", value: 5, color: "#6b7280" },
        ]} />
      </div>
    </>
  );
}

function SupervisorDashboard() {
  return (
    <>
      <StatGrid columns={3}>
        <StatCard title="Active Batches" value="6" icon={Leaf} />
        <StatCard title="Today's Output" value="310 kg" icon={Package} trend={{ value: 8, label: "vs yesterday" }} />
        <StatCard title="Wastage (Today)" value="4.2 kg" icon={AlertTriangle} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart title="Batch Progress" data={[
          { label: "BATCH-A01", value: 85, color: "#22c55e" }, { label: "BATCH-A02", value: 60, color: "#3b82f6" },
          { label: "BATCH-A03", value: 40, color: "#f59e0b" }, { label: "BATCH-A04", value: 20, color: "#8b5cf6" },
        ]} />
        <Card>
          <CardHeader><CardTitle className="text-sm">Today's Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">Quality check BATCH-A01</span>
              <Badge>Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">Start blending BATCH-A05</span>
              <Badge variant="outline">Scheduled</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-green-50">
              <span className="text-sm">Package BATCH-B12</span>
              <Badge variant="secondary">Done</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function WorkerDashboard() {
  return (
    <>
      <StatGrid columns={3}>
        <StatCard title="My Attendance (Month)" value="22/24" icon={Clock} description="91.6% attendance" />
        <StatCard title="Assigned Batch" value="BATCH-A03" icon={Leaf} description="In Progress" />
        <StatCard title="Hours Today" value="6.5h" icon={Clock} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">My Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div>
                <p className="text-sm font-medium">Morning Shift</p>
                <p className="text-xs text-muted-foreground">6:00 AM - 2:00 PM</p>
              </div>
              <Badge>Today</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div>
                <p className="text-sm font-medium">Assigned: Green Tea Processing</p>
                <p className="text-xs text-muted-foreground">Batch BATCH-A03 • Blending Stage</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">This Week's Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{day}</p>
                  <div className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                    i < 5 ? "bg-green-100 text-green-700" : i === 5 ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < 5 ? "✓" : i === 5 ? "½" : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DealerDashboard() {
  return (
    <>
      <StatGrid columns={3}>
        <StatCard title="My Orders" value="18" icon={ShoppingCart} />
        <StatCard title="Pending Invoices" value="3" icon={FileText} className="border-yellow-500/50" />
        <StatCard title="Outstanding" value="₹1.2L" icon={TrendingUp} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChart title="My Purchase History" data={[
          { label: "Jan", value: 120000 }, { label: "Feb", value: 95000 }, { label: "Mar", value: 145000 },
          { label: "Apr", value: 110000 }, { label: "May", value: 168000 }, { label: "Jun", value: 132000 },
        ]} />
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Invoices</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div>
                <p className="text-sm font-medium font-mono">INV-2024-001</p>
                <p className="text-xs text-muted-foreground">₹45,000 • Due: 15 Jan</p>
              </div>
              <Badge variant="destructive">Unpaid</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div>
                <p className="text-sm font-medium font-mono">INV-2024-002</p>
                <p className="text-xs text-muted-foreground">₹32,000 • Due: 20 Jan</p>
              </div>
              <Badge variant="secondary">Partial</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-green-50">
              <div>
                <p className="text-sm font-medium font-mono">INV-2024-003</p>
                <p className="text-xs text-muted-foreground">₹28,500 • Paid: 10 Jan</p>
              </div>
              <Badge>Paid</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;

  const descriptions: Record<string, string> = {
    ADMIN: "Full system overview across all modules.",
    MANAGER: "Sales, production, and inventory at a glance.",
    SUPERVISOR: "Production batches and daily operations.",
    WORKER: "Your schedule, attendance, and assigned tasks.",
    DEALER: "Your orders, invoices, and payment status.",
  };

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name ?? "User"}`}
        description={descriptions[role || "WORKER"] || ""}
      />

      {role === "ADMIN" && <AdminDashboard />}
      {role === "MANAGER" && <ManagerDashboard />}
      {role === "SUPERVISOR" && <SupervisorDashboard />}
      {role === "WORKER" && <WorkerDashboard />}
      {role === "DEALER" && <DealerDashboard />}
    </>
  );
}
