import { db } from "@/lib/db";

type Period = "7d" | "30d" | "90d" | "1y";

function getSince(period: Period) {
  const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[period];
  return new Date(Date.now() - days * 86400000);
}

// ─── Sales Report ───────────────────────────────────────────────────────────

export async function getSalesReport(period: Period) {
  const since = getSince(period);

  const [revenue, orders, byProduct, byMonth, byStatus] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null }, _sum: { netAmount: true }, _count: true }),
    db.sale.findMany({ where: { saleDate: { gte: since }, deletedAt: null }, include: { dealer: { select: { companyName: true } }, items: true }, orderBy: { saleDate: "desc" }, take: 100 }),
    db.saleItem.groupBy({ by: ["productId"], where: { sale: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null } }, _sum: { quantity: true, totalPrice: true }, orderBy: { _sum: { totalPrice: "desc" } }, take: 10 }),
    db.$queryRaw<{ month: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(s."saleDate", 'YYYY-MM') as month, SUM(s."netAmount")::float as revenue, COUNT(*)::int as orders
      FROM "Sale" s WHERE s."saleDate" >= ${since} AND s.status != 'CANCELLED' AND s."deletedAt" IS NULL
      GROUP BY month ORDER BY month`,
    db.sale.groupBy({ by: ["status"], where: { saleDate: { gte: since }, deletedAt: null }, _count: true }),
  ]);

  const productIds = byProduct.map((p) => p.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const pMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  return {
    totalRevenue: Number(revenue._sum.netAmount ?? 0),
    totalOrders: revenue._count,
    avgOrderValue: revenue._count > 0 ? Number(revenue._sum.netAmount ?? 0) / revenue._count : 0,
    byProduct: byProduct.map((p) => ({ name: pMap[p.productId] || "Unknown", quantity: Number(p._sum.quantity), revenue: Number(p._sum.totalPrice) })),
    byMonth,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    orders: orders.map((o) => ({ orderNumber: o.orderNumber, dealer: o.dealer.companyName, amount: Number(o.netAmount), items: o.items.length, status: o.status, date: o.saleDate })),
  };
}

// ─── Inventory Report ───────────────────────────────────────────────────────

export async function getInventoryReport() {
  const [items, byWarehouse, byCategory, lowStock, movements] = await Promise.all([
    db.inventoryItem.findMany({ include: { product: { select: { name: true, sku: true, category: true } }, warehouse: { select: { name: true } } }, orderBy: { quantity: "desc" }, take: 100 }),
    db.$queryRaw<{ warehouse: string; totalQty: number; totalValue: number; items: number }[]>`
      SELECT w.name as warehouse, SUM(i.quantity)::float as "totalQty", SUM(i.quantity * i."costPerUnit")::float as "totalValue", COUNT(*)::int as items
      FROM "InventoryItem" i JOIN "Warehouse" w ON i."warehouseId" = w.id
      GROUP BY w.name ORDER BY "totalValue" DESC`,
    db.$queryRaw<{ category: string; totalQty: number; count: number }[]>`
      SELECT p.category, SUM(i.quantity)::float as "totalQty", COUNT(*)::int as count
      FROM "InventoryItem" i JOIN "Product" p ON i."productId" = p.id
      GROUP BY p.category ORDER BY "totalQty" DESC`,
    db.$queryRaw<any[]>`SELECT i.*, p.name as "productName", p.sku, w.name as "warehouseName"
      FROM "InventoryItem" i JOIN "Product" p ON i."productId" = p.id JOIN "Warehouse" w ON i."warehouseId" = w.id
      WHERE i.quantity <= i."minStock" AND i."minStock" > 0 ORDER BY (i.quantity / NULLIF(i."minStock", 0)) ASC`,
    db.stockMovement.groupBy({ by: ["type"], _sum: { quantity: true }, _count: true }),
  ]);

  const totalValue = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.costPerUnit), 0);
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  return {
    totalItems: items.length,
    totalQuantity: totalQty,
    totalValue,
    lowStockCount: lowStock.length,
    byWarehouse,
    byCategory,
    lowStock,
    movements: movements.map((m) => ({ type: m.type, quantity: Number(m._sum.quantity), count: m._count })),
    items: items.map((i) => ({ product: i.product.name, sku: i.product.sku, category: i.product.category, warehouse: i.warehouse.name, quantity: Number(i.quantity), value: Number(i.quantity) * Number(i.costPerUnit) })),
  };
}

// ─── Dealer Performance ─────────────────────────────────────────────────────

export async function getDealerReport(period: Period) {
  const since = getSince(period);

  const dealers = await db.dealer.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      sales: { where: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null }, select: { netAmount: true, saleDate: true } },
      invoices: { where: { deletedAt: null }, select: { totalAmount: true, paidAmount: true, status: true } },
    },
  });

  return dealers.map((d) => {
    const totalRevenue = d.sales.reduce((sum, s) => sum + Number(s.netAmount), 0);
    const totalInvoiced = d.invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const totalPaid = d.invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    const outstanding = totalInvoiced - totalPaid;
    const overdueCount = d.invoices.filter((i) => i.status === "OVERDUE" || (i.status !== "PAID" && i.status !== "CANCELLED")).length;

    return {
      name: d.companyName,
      code: d.dealerCode,
      contact: d.contactName,
      phone: d.phone,
      orders: d.sales.length,
      revenue: totalRevenue,
      outstanding,
      overdueInvoices: overdueCount,
      creditLimit: Number(d.creditLimit),
      balance: Number(d.balance),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ─── Production Report ──────────────────────────────────────────────────────

export async function getProductionReport(period: Period) {
  const since = getSince(period);

  const [batches, wastage, byProduct, yieldTrend] = await Promise.all([
    db.productionBatch.findMany({
      where: { startDate: { gte: since } },
      include: { product: { select: { name: true } }, employee: { include: { user: { select: { name: true } } } } },
      orderBy: { startDate: "desc" },
    }),
    db.$queryRaw<{ category: string; total: number; count: number }[]>`
      SELECT category, SUM(quantity)::float as total, COUNT(*)::int as count
      FROM "Wastage" WHERE "reportedAt" >= ${since} GROUP BY category ORDER BY total DESC`,
    db.$queryRaw<{ product: string; batches: number; totalInput: number; totalOutput: number }[]>`
      SELECT p.name as product, COUNT(*)::int as batches, SUM(b."rawMaterialQty")::float as "totalInput", SUM(b."outputQty")::float as "totalOutput"
      FROM "ProductionBatch" b JOIN "Product" p ON b."productId" = p.id
      WHERE b."startDate" >= ${since} GROUP BY p.name ORDER BY "totalOutput" DESC`,
    db.$queryRaw<{ month: string; avgYield: number; batches: number }[]>`
      SELECT TO_CHAR(b."startDate", 'YYYY-MM') as month, AVG(b."actualYield")::float as "avgYield", COUNT(*)::int as batches
      FROM "ProductionBatch" b WHERE b."startDate" >= ${since} AND b."actualYield" IS NOT NULL
      GROUP BY month ORDER BY month`,
  ]);

  const completed = batches.filter((b) => b.status === "COMPLETED");
  const totalInput = completed.reduce((sum, b) => sum + Number(b.rawMaterialQty), 0);
  const totalOutput = completed.reduce((sum, b) => sum + Number(b.outputQty), 0);
  const totalWastage = wastage.reduce((sum, w) => sum + w.total, 0);

  return {
    totalBatches: batches.length,
    completedBatches: completed.length,
    totalInput,
    totalOutput,
    overallYield: totalInput > 0 ? (totalOutput / totalInput) * 100 : 0,
    totalWastage,
    wastageByCategory: wastage,
    byProduct,
    yieldTrend,
    batches: batches.map((b) => ({
      batchNumber: b.batchNumber, product: b.product.name, employee: b.employee.user.name,
      input: Number(b.rawMaterialQty), output: Number(b.outputQty),
      yield: b.actualYield ? Number(b.actualYield) : null, status: b.status, date: b.startDate,
    })),
  };
}

// ─── Attendance Report ──────────────────────────────────────────────────────

export async function getAttendanceReport(period: Period) {
  const since = getSince(period);

  const [records, byStatus, byEmployee, dailyTrend] = await Promise.all([
    db.attendance.findMany({
      where: { date: { gte: since } },
      include: { employee: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
    db.attendance.groupBy({ by: ["status"], where: { date: { gte: since } }, _count: true }),
    db.$queryRaw<{ name: string; present: number; absent: number; total: number }[]>`
      SELECT u.name, 
        COUNT(*) FILTER (WHERE a.status = 'PRESENT' OR a.status = 'HALF_DAY')::int as present,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT')::int as absent,
        COUNT(*)::int as total
      FROM "Attendance" a JOIN "Employee" e ON a."employeeId" = e.id JOIN "User" u ON e."userId" = u.id
      WHERE a.date >= ${since} GROUP BY u.name ORDER BY present DESC`,
    db.$queryRaw<{ date: string; present: number; absent: number }[]>`
      SELECT TO_CHAR(a.date, 'YYYY-MM-DD') as date,
        COUNT(*) FILTER (WHERE a.status = 'PRESENT')::int as present,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT')::int as absent
      FROM "Attendance" a WHERE a.date >= ${since}
      GROUP BY a.date ORDER BY a.date DESC LIMIT 30`,
  ]);

  const totalRecords = records.length;
  const presentCount = byStatus.find((s) => s.status === "PRESENT")?._count ?? 0;
  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  return {
    totalRecords,
    attendanceRate,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byEmployee,
    dailyTrend: dailyTrend.reverse(),
    records: records.slice(0, 50).map((r) => ({
      employee: r.employee.user.name, date: r.date, status: r.status,
      checkIn: r.checkIn, checkOut: r.checkOut, hours: r.hoursWorked ? Number(r.hoursWorked) : null,
    })),
  };
}
