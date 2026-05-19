import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  ProductCreateInput,
  ProductUpdateInput,
  WarehouseCreateInput,
  WarehouseUpdateInput,
  StockMovementInput,
  AdjustmentInput,
  BarcodeAssignInput,
} from "@/lib/validators/inventory";

// ─── Products ───────────────────────────────────────────────────────────────

export async function getProducts(filters?: { category?: string; search?: string; active?: boolean }) {
  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (filters?.category) where.category = filters.category;
  if (filters?.active !== undefined) where.isActive = filters.active;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return db.product.findMany({ where, orderBy: { name: "asc" } });
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id, deletedAt: null },
    include: { inventoryItems: { include: { warehouse: true } } },
  });
}

export async function createProduct(data: ProductCreateInput) {
  return db.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      teaGrade: data.teaGrade,
      description: data.description,
      unitWeight: data.unitWeight,
      unit: data.unit,
      basePrice: data.basePrice,
    },
  });
}

export async function updateProduct(data: ProductUpdateInput) {
  const { id, ...rest } = data;
  return db.product.update({ where: { id }, data: rest });
}

export async function deleteProduct(id: string) {
  return db.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}

// ─── Warehouses ─────────────────────────────────────────────────────────────

export async function getWarehouses() {
  return db.warehouse.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { inventoryItems: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getWarehouseById(id: string) {
  return db.warehouse.findUnique({
    where: { id, deletedAt: null },
    include: {
      inventoryItems: { include: { product: true } },
      _count: { select: { inventoryItems: true } },
    },
  });
}

export async function createWarehouse(data: WarehouseCreateInput) {
  return db.warehouse.create({ data });
}

export async function updateWarehouse(data: WarehouseUpdateInput) {
  const { id, ...rest } = data;
  return db.warehouse.update({ where: { id }, data: rest });
}

export async function deleteWarehouse(id: string) {
  const hasStock = await db.inventoryItem.count({ where: { warehouseId: id, quantity: { gt: 0 } } });
  if (hasStock > 0) throw new Error("Cannot delete warehouse with existing stock");
  return db.warehouse.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}

// ─── Inventory Items ────────────────────────────────────────────────────────

export async function getInventoryItems(filters?: { warehouseId?: string; productId?: string; lowStock?: boolean }) {
  const where: Prisma.InventoryItemWhereInput = {};
  if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters?.productId) where.productId = filters.productId;
  if (filters?.lowStock) {
    where.quantity = { lte: db.inventoryItem.fields.minStock as any };
    // Prisma doesn't support field comparison directly, use raw query below
  }

  return db.inventoryItem.findMany({
    where,
    include: { product: true, warehouse: true, batch: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLowStockItems() {
  return db.$queryRaw<any[]>`
    SELECT i.*, p.name as "productName", p.sku, w.name as "warehouseName"
    FROM "InventoryItem" i
    JOIN "Product" p ON i."productId" = p.id
    JOIN "Warehouse" w ON i."warehouseId" = w.id
    WHERE i.quantity <= i."minStock" AND i."minStock" > 0
    ORDER BY (i.quantity / NULLIF(i."minStock", 0)) ASC
  `;
}

// ─── Stock Movements ────────────────────────────────────────────────────────

export async function createStockMovement(data: StockMovementInput, userId: string) {
  return db.$transaction(async (tx) => {
    // Record movement
    const movement = await tx.stockMovement.create({
      data: {
        type: data.type,
        productId: data.productId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        quantity: data.quantity,
        batchNumber: data.batchNumber,
        reference: data.reference,
        notes: data.notes,
      },
    });

    // Update inventory based on movement type
    if (data.type === "INBOUND" && data.toWarehouseId) {
      await upsertInventoryQty(tx, data.productId, data.toWarehouseId, data.quantity, data.batchNumber);
    }

    if (data.type === "OUTBOUND" && data.fromWarehouseId) {
      await decrementInventoryQty(tx, data.productId, data.fromWarehouseId, data.quantity);
    }

    if (data.type === "TRANSFER" && data.fromWarehouseId && data.toWarehouseId) {
      await decrementInventoryQty(tx, data.productId, data.fromWarehouseId, data.quantity);
      await upsertInventoryQty(tx, data.productId, data.toWarehouseId, data.quantity, data.batchNumber);
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_MOVEMENT",
        entity: "StockMovement",
        entityId: movement.id,
        newData: data as any,
      },
    });

    return movement;
  });
}

export async function getStockMovements(filters?: { productId?: string; type?: string; limit?: number }) {
  const where: Prisma.StockMovementWhereInput = {};
  if (filters?.productId) where.productId = filters.productId;
  if (filters?.type) where.type = filters.type as any;

  return db.stockMovement.findMany({
    where,
    include: {
      fromWarehouse: { select: { name: true, code: true } },
      toWarehouse: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

// ─── Adjustments ────────────────────────────────────────────────────────────

export async function adjustInventory(data: AdjustmentInput, userId: string) {
  return db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
    if (!item) throw new Error("Inventory item not found");

    const oldQty = Number(item.quantity);
    const diff = data.newQuantity - oldQty;

    // Update quantity
    const updated = await tx.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: { quantity: data.newQuantity },
    });

    // Record as stock movement
    await tx.stockMovement.create({
      data: {
        type: "ADJUSTMENT",
        productId: item.productId,
        fromWarehouseId: diff < 0 ? item.warehouseId : undefined,
        toWarehouseId: diff > 0 ? item.warehouseId : undefined,
        quantity: Math.abs(diff),
        reference: `ADJ-${Date.now().toString(36).toUpperCase()}`,
        notes: `${data.reason}${data.notes ? ` - ${data.notes}` : ""}`,
      },
    });

    // Audit
    await tx.auditLog.create({
      data: {
        userId,
        action: "INVENTORY_ADJUSTMENT",
        entity: "InventoryItem",
        entityId: data.inventoryItemId,
        oldData: { quantity: oldQty },
        newData: { quantity: data.newQuantity, reason: data.reason },
      },
    });

    return updated;
  });
}

// ─── Barcode ────────────────────────────────────────────────────────────────

export async function lookupByBarcode(barcode: string) {
  // SKU is used as barcode identifier
  const product = await db.product.findFirst({
    where: { sku: barcode, deletedAt: null },
    include: { inventoryItems: { include: { warehouse: true } } },
  });
  return product;
}

export async function assignBarcode(data: BarcodeAssignInput) {
  // Update SKU to barcode value (SKU serves as barcode in this system)
  return db.product.update({
    where: { id: data.productId },
    data: { sku: data.barcode },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertInventoryQty(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number,
  batchNumber?: string
) {
  const existing = await tx.inventoryItem.findFirst({
    where: { productId, warehouseId, batch: batchNumber ? { batchNumber } : undefined },
  });

  if (existing) {
    await tx.inventoryItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    const product = await tx.product.findUnique({ where: { id: productId } });
    await tx.inventoryItem.create({
      data: {
        productId,
        warehouseId,
        quantity,
        costPerUnit: product?.basePrice ?? 0,
        batchId: batchNumber ? (await tx.productionBatch.findUnique({ where: { batchNumber } }))?.id : undefined,
      },
    });
  }
}

async function decrementInventoryQty(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number
) {
  const item = await tx.inventoryItem.findFirst({ where: { productId, warehouseId } });
  if (!item) throw new Error("No stock found in source warehouse");
  if (Number(item.quantity) < quantity) throw new Error("Insufficient stock for movement");

  await tx.inventoryItem.update({
    where: { id: item.id },
    data: { quantity: { decrement: quantity } },
  });
}
