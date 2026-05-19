"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { LineChart, DonutChart, BarChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { ReportControls } from "../report-controls";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

const statusColors: Record<string, string> = { PRESENT: "#16a34a", ABSENT: "#ef4444", HALF_DAY: "#f59e0b", LEAVE: "#8b5cf6" };

export default function AttendanceReportPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch(`/api/reports/attendance?period=${period}`).then((r) => r.json()).then((j) => setData(j.data));
  }, [period]);

  if (!data) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const presentCount = data.byStatus.find((s: any) => s.status === "PRESENT")?.count ?? 0;
  const absentCount = data.byStatus.find((s: any) => s.status === "ABSENT")?.count ?? 0;

  const recordColumns: Column<any>[] = [
    { key: "employee", header: "Employee", sortable: true },
    { key: "date", header: "Date", sortable: true, render: (r) => new Date(r.date).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "PRESENT" ? "default" : r.status === "ABSENT" ? "destructive" : "secondary"}>{r.status}</Badge> },
    { key: "hours", header: "Hours", render: (r) => r.hours ? `${r.hours}h` : "—" },
  ];

  const employeeColumns: Column<any>[] = [
    { key: "name", header: "Employee", sortable: true },
    { key: "present", header: "Present", sortable: true },
    { key: "absent", header: "Absent", sortable: true },
    { key: "total", header: "Total Days" },
    { key: "rate", header: "Rate", sortable: true, render: (r) => `${((r.present / Math.max(r.total, 1)) * 100).toFixed(0)}%` },
  ];

  return (
    <>
      <PageHeader title="Attendance Report">
        <ReportControls period={period} onPeriodChange={setPeriod} reportType="attendance" />
      </PageHeader>

      <StatGrid>
        <StatCard title="Total Records" value={data.totalRecords} icon={Users} />
        <StatCard title="Attendance Rate" value={`${data.attendanceRate.toFixed(1)}%`} icon={CheckCircle} />
        <StatCard title="Present Days" value={presentCount} icon={Clock} />
        <StatCard title="Absent Days" value={absentCount} icon={XCircle} className={absentCount > 0 ? "border-yellow-500/50" : ""} />
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LineChart
          title="Daily Attendance"
          data={data.dailyTrend.map((d: any) => ({ label: d.date.slice(5), value: d.present }))}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Status Distribution"
          data={data.byStatus.map((s: any) => ({ label: s.status, value: s.count, color: statusColors[s.status] || "#6b7280" }))}
        />
      </div>

      <BarChart title="Attendance by Employee" data={data.byEmployee.slice(0, 10).map((e: any) => ({ label: e.name, value: e.present }))} />

      <div className="grid gap-4 md:grid-cols-2">
        <DataTable data={data.byEmployee} columns={employeeColumns} searchPlaceholder="Search employees..." pageSize={10} />
        <DataTable data={data.records} columns={recordColumns} searchPlaceholder="Search records..." pageSize={10} />
      </div>
    </>
  );
}
