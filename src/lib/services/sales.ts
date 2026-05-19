import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { SaleCreateInput, InvoiceCreateInput, PaymentCreateInput } from "@/lib/validators/sales";

// ─── Sales ──────────────────────────────────────────────────────────────────

export async function getSales(filters?: { dealerId?: string; status?: string; from?: string; to?: string }) {
  const where: Prisma.SaleWhereInput = { deletedAt: null };
  if (filters?.dealerId) where.dealerId = filters.dealerId;
  if (filters?.status) where.status = filters.status as any;
  if (filters?.from || filters?.to) {
    where.saleDate = {};
    if (filters.from) where.saleDate.gte = new Date(filters.from);
    if (filters.to) where.saleDate.lte = new Date(filters.to);
  }

  return db.sale.findMany({
    where,
    include: {
      dealer: { select: { companyName: true, dealerCode: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
      invoice: { select: { id: true, invoiceNo: true, status: true, paidAmount: true, totalAmount: true } },
    },
    orderBy: { saleDate: "desc" },
  });
}

export async function getSaleById(id: string) {
  return db.sale.findUnique({
    where: { id, deletedAt: null },
    include: {
      dealer: true,
      items: { include: { product: true, inventoryItem: { include: { warehouse: true } } } },
      invoice: { include: { payments: true } },
    },
  });
}

export async function createSale(data: SaleCreateInput, userId: string) {
  return db.$transaction(async (tx) => {
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const netAmount = totalAmount - data.discount;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Validate stock availability
    for (const item of data.items) {
      const inv = await tx.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
      if (!inv) throw new Error(`Inventory item not found`);
      if (Number(inv.quantity) - Number(inv.reservedQty) < item.quantity) {
        throw new Error(`Insufficient stock for product`);
      }
    }

    // Create sale
    const sale = await tx.sale.create({
      data: {
        orderNumber,
        dealerId: data.dealerId,
        totalAmount,
        discount: data.discount,
        netAmount,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true, dealer: true },
    });

    // Reserve stock
    for (const item of data.items) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { reservedQty: { increment: item.quantity } },
      });
    }

    // Audit
    await tx.auditLog.create({
      data: { userId, action: "CREATE", entity: "Sale", entityId: sale.id, newData: { orderNumber, totalAmount } },
    });

    return sale;
  });
}

export async function updateSaleStatus(id: string, status: string, userId: string) {
  return db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw new Error("Sale not found");

    // On CONFIRMED: deduct stock, release reservation
    if (status === "CONFIRMED" && sale.status === "DRAFT") {
      for (const item of sale.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: { decrement: Number(item.quantity) },
            reservedQty: { decrement: Number(item.quantity) },
          },
        });
        // Record outbound movement
        await tx.stockMovement.create({
          data: {
            type: "OUTBOUND",
            productId: item.productId,
            fromWarehouseId: (await tx.inventoryItem.findUnique({ where: { id: item.inventoryItemId } }))?.warehouseId,
            quantity: Number(item.quantity),
            reference: sale.orderNumber,
            notes: `Sale order ${sale.orderNumber}`,
          },
        });
      }
    }

    // On CANCELLED: release reservation
    if (status === "CANCELLED" && sale.status === "DRAFT") {
      for (const item of sale.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { reservedQty: { decrement: Number(item.quantity) } },
        });
      }
    }

    const updated = await tx.sale.update({ where: { id }, data: { status: status as any } });

    await tx.auditLog.create({
      data: { userId, action: "STATUS_CHANGE", entity: "Sale", entityId: id, oldData: { status: sale.status }, newData: { status } },
    });

    return updated;
  });
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export async function createInvoice(data: InvoiceCreateInput, userId: string) {
  return db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: data.saleId }, include: { dealer: true, invoice: true } });
    if (!sale) throw new Error("Sale not found");
    if (sale.invoice) throw new Error("Invoice already exists for this sale");
    if (sale.status === "DRAFT" || sale.status === "CANCELLED") throw new Error("Sale must be confirmed before invoicing");

    const subtotal = Number(sale.netAmount);
    const taxAmount = (subtotal * data.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        saleId: data.saleId,
        dealerId: sale.dealerId,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        totalAmount,
        dueDate: new Date(data.dueDate),
      },
      include: { sale: { include: { items: { include: { product: true } } } }, dealer: true },
    });

    // Update dealer balance
    await tx.dealer.update({
      where: { id: sale.dealerId },
      data: { balance: { increment: totalAmount } },
    });

    await tx.auditLog.create({
      data: { userId, action: "CREATE", entity: "Invoice", entityId: invoice.id, newData: { invoiceNo, totalAmount } },
    });

    return invoice;
  });
}

export async function getInvoices(filters?: { dealerId?: string; status?: string }) {
  const where: Prisma.InvoiceWhereInput = { deletedAt: null };
  if (filters?.dealerId) where.dealerId = filters.dealerId;
  if (filters?.status) where.status = filters.status as any;

  return db.invoice.findMany({
    where,
    include: {
      dealer: { select: { companyName: true, dealerCode: true } },
      sale: { select: { orderNumber: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: {
      dealer: true,
      sale: { include: { items: { include: { product: true } } } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

export async function getOutstandingDues() {
  return db.invoice.findMany({
    where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] }, deletedAt: null },
    include: { dealer: { select: { companyName: true, dealerCode: true, phone: true } } },
    orderBy: { dueDate: "asc" },
  });
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function recordPayment(invoiceId: string, data: PaymentCreateInput, userId: string) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error("Invoice not found");

    const currentPaid = Number(invoice.paidAmount);
    const total = Number(invoice.totalAmount);
    const newPaid = currentPaid + data.amount;

    if (newPaid > total) throw new Error("Payment exceeds invoice total");

    // Create payment record
    await tx.payment.create({
      data: { invoiceId, amount: data.amount, method: data.method, reference: data.reference },
    });

    // Update invoice
    const newStatus = newPaid >= total ? "PAID" : "PARTIALLY_PAID";
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount: newPaid, status: newStatus, paidAt: newPaid >= total ? new Date() : undefined },
    });

    // Update dealer balance
    await tx.dealer.update({
      where: { id: invoice.dealerId },
      data: { balance: { decrement: data.amount } },
    });

    await tx.auditLog.create({
      data: { userId, action: "PAYMENT", entity: "Invoice", entityId: invoiceId, newData: { amount: data.amount, method: data.method } },
    });

    return { paid: newPaid, remaining: total - newPaid, status: newStatus };
  });
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getSalesAnalytics(period: "7d" | "30d" | "90d" | "1y" = "30d") {
  const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[period];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalRevenue, salesCount, topDealers, topProducts, monthlySales] = await Promise.all([
    db.sale.aggregate({
      where: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null },
      _sum: { netAmount: true },
    }),
    db.sale.count({ where: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null } }),
    db.sale.groupBy({
      by: ["dealerId"],
      where: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null },
      _sum: { netAmount: true },
      _count: true,
      orderBy: { _sum: { netAmount: "desc" } },
      take: 5,
    }),
    db.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { saleDate: { gte: since }, status: { not: "CANCELLED" }, deletedAt: null } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
    db.$queryRaw<{ month: string; revenue: number; count: number }[]>`
      SELECT TO_CHAR(s."saleDate", 'YYYY-MM') as month,
             SUM(s."netAmount")::float as revenue,
             COUNT(*)::int as count
      FROM "Sale" s
      WHERE s."saleDate" >= ${since} AND s.status != 'CANCELLED' AND s."deletedAt" IS NULL
      GROUP BY TO_CHAR(s."saleDate", 'YYYY-MM')
      ORDER BY month ASC
    `,
  ]);

  // Resolve dealer names
  const dealerIds = topDealers.map((d) => d.dealerId);
  const dealers = await db.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, companyName: true } });
  const dealerMap = Object.fromEntries(dealers.map((d) => [d.id, d.companyName]));

  // Resolve product names
  const productIds = topProducts.map((p) => p.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  // Outstanding summary
  const outstanding = await db.invoice.aggregate({
    where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] }, deletedAt: null },
    _sum: { totalAmount: true, paidAmount: true },
    _count: true,
  });

  return {
    totalRevenue: Number(totalRevenue._sum.netAmount ?? 0),
    salesCount,
    avgOrderValue: salesCount > 0 ? Number(totalRevenue._sum.netAmount ?? 0) / salesCount : 0,
    outstandingAmount: Number(outstanding._sum.totalAmount ?? 0) - Number(outstanding._sum.paidAmount ?? 0),
    outstandingCount: outstanding._count,
    topDealers: topDealers.map((d) => ({ name: dealerMap[d.dealerId] || "Unknown", revenue: Number(d._sum.netAmount), orders: d._count })),
    topProducts: topProducts.map((p) => ({ name: productMap[p.productId] || "Unknown", quantity: Number(p._sum.quantity), revenue: Number(p._sum.totalPrice) })),
    monthlySales,
  };
}
