import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/api-response";
import { generateCSV, generateReportHTML } from "@/lib/services/export";
import { getSalesReport, getInventoryReport, getDealerReport, getProductionReport, getAttendanceReport } from "@/lib/services/reports";

export async function GET(req: NextRequest) {
  return withPermission("reports:export")(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") || "sales";
      const format = searchParams.get("format") || "csv";
      const period = (searchParams.get("period") || "30d") as any;

      let data: any[] = [];
      let columns: { key: string; header: string; format?: (v: any) => string }[] = [];
      let title = "";
      let summary: { label: string; value: string }[] = [];

      switch (type) {
        case "sales": {
          const report = await getSalesReport(period);
          title = "Sales Report";
          data = report.orders;
          columns = [
            { key: "orderNumber", header: "Order #" },
            { key: "dealer", header: "Dealer" },
            { key: "amount", header: "Amount", format: (v) => `₹${Number(v).toLocaleString()}` },
            { key: "items", header: "Items" },
            { key: "status", header: "Status" },
            { key: "date", header: "Date", format: (v) => new Date(v).toLocaleDateString() },
          ];
          summary = [
            { label: "Total Revenue", value: `₹${report.totalRevenue.toLocaleString()}` },
            { label: "Orders", value: String(report.totalOrders) },
            { label: "Avg Order", value: `₹${Math.round(report.avgOrderValue).toLocaleString()}` },
          ];
          break;
        }
        case "inventory": {
          const report = await getInventoryReport();
          title = "Inventory Report";
          data = report.items;
          columns = [
            { key: "product", header: "Product" },
            { key: "sku", header: "SKU" },
            { key: "category", header: "Category" },
            { key: "warehouse", header: "Warehouse" },
            { key: "quantity", header: "Quantity (kg)" },
            { key: "value", header: "Value", format: (v) => `₹${Number(v).toLocaleString()}` },
          ];
          summary = [
            { label: "Total Items", value: String(report.totalItems) },
            { label: "Total Value", value: `₹${report.totalValue.toLocaleString()}` },
            { label: "Low Stock", value: String(report.lowStockCount) },
          ];
          break;
        }
        case "dealers": {
          const report = await getDealerReport(period);
          title = "Dealer Performance Report";
          data = report;
          columns = [
            { key: "name", header: "Company" },
            { key: "code", header: "Code" },
            { key: "orders", header: "Orders" },
            { key: "revenue", header: "Revenue", format: (v) => `₹${Number(v).toLocaleString()}` },
            { key: "outstanding", header: "Outstanding", format: (v) => `₹${Number(v).toLocaleString()}` },
            { key: "overdueInvoices", header: "Overdue" },
          ];
          summary = [
            { label: "Total Dealers", value: String(report.length) },
            { label: "Total Revenue", value: `₹${report.reduce((s: number, d: any) => s + d.revenue, 0).toLocaleString()}` },
          ];
          break;
        }
        case "production": {
          const report = await getProductionReport(period);
          title = "Production Report";
          data = report.batches;
          columns = [
            { key: "batchNumber", header: "Batch #" },
            { key: "product", header: "Product" },
            { key: "employee", header: "Employee" },
            { key: "input", header: "Input (kg)" },
            { key: "output", header: "Output (kg)" },
            { key: "yield", header: "Yield %", format: (v) => v ? `${Number(v).toFixed(1)}%` : "—" },
            { key: "status", header: "Status" },
            { key: "date", header: "Date", format: (v) => new Date(v).toLocaleDateString() },
          ];
          summary = [
            { label: "Batches", value: String(report.totalBatches) },
            { label: "Output", value: `${report.totalOutput.toLocaleString()} kg` },
            { label: "Yield", value: `${report.overallYield.toFixed(1)}%` },
            { label: "Wastage", value: `${report.totalWastage.toFixed(1)} kg` },
          ];
          break;
        }
        case "attendance": {
          const report = await getAttendanceReport(period);
          title = "Attendance Report";
          data = report.records;
          columns = [
            { key: "employee", header: "Employee" },
            { key: "date", header: "Date", format: (v) => new Date(v).toLocaleDateString() },
            { key: "status", header: "Status" },
            { key: "hours", header: "Hours", format: (v) => v ? String(v) : "—" },
          ];
          summary = [
            { label: "Records", value: String(report.totalRecords) },
            { label: "Attendance Rate", value: `${report.attendanceRate.toFixed(1)}%` },
          ];
          break;
        }
      }

      if (format === "csv") {
        const csv = generateCSV(data, columns);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${type}-report-${period}.csv"`,
          },
        });
      }

      // PDF (HTML)
      const html = generateReportHTML({ title, period: `Period: ${period}`, columns, data, summary });
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html", "Content-Disposition": `inline; filename="${type}-report.html"` },
      });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
