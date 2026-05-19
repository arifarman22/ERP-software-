import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  RawMaterialInput, RawMaterialStockInput, BlendRecipeInput,
  BatchCreateInput, BatchStatusInput, PackagingInput, WastageInput,
} from "@/lib/validators/production";

// ─── Raw Materials ──────────────────────────────────────────────────────────

export async function getRawMaterials(filters?: { category?: string; lowStock?: boolean }) {
  const where: Prisma.RawMaterialWhereInput = { isActive: true };
  if (filters?.category) where.category = filters.category;
  return db.rawMaterial.findMany({ where, orderBy: { name: "asc" } });
}

export async function createRawMaterial(data: RawMaterialInput) {
  return db.rawMaterial.create({ data });
}

export async function updateRawMaterialStock(data: RawMaterialStockInput, userId: string) {
  return db.$transaction(async (tx) => {
    const material = await tx.rawMaterial.findUnique({ where: { id: data.id } });
    if (!material) throw new Error("Raw material not found");

    const newQty = data.type === "ADD"
      ? Number(material.quantity) + data.quantity
      : Number(material.quantity) - data.quantity;

    if (newQty < 0) throw new Error("Insufficient raw material stock");

    const updated = await tx.rawMaterial.update({
      where: { id: data.id },
      data: { quantity: newQty },
    });

    await tx.auditLog.create({
      data: {
        userId, action: `RAW_MATERIAL_${data.type}`, entity: "RawMaterial", entityId: data.id,
        oldData: { quantity: Number(material.quantity) },
        newData: { quantity: newQty, reason: data.reason },
      },
    });

    return updated;
  });
}

export async function getLowStockMaterials() {
  return db.$queryRaw<any[]>`
    SELECT * FROM "RawMaterial"
    WHERE quantity <= "minStock" AND "minStock" > 0 AND "isActive" = true
    ORDER BY (quantity / NULLIF("minStock", 0)) ASC
  `;
}

// ─── Blend Recipes ──────────────────────────────────────────────────────────

export async function getBlendRecipes() {
  return db.blendRecipe.findMany({
    where: { isActive: true },
    include: {
      outputProduct: { select: { name: true, sku: true } },
      ingredients: { include: { rawMaterial: { select: { name: true, code: true, unit: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createBlendRecipe(data: BlendRecipeInput) {
  const totalPercentage = data.ingredients.reduce((sum, i) => sum + i.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) throw new Error("Ingredient percentages must total 100%");

  return db.blendRecipe.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      outputProductId: data.outputProductId,
      targetYield: data.targetYield,
      ingredients: {
        create: data.ingredients.map((i) => ({
          rawMaterialId: i.rawMaterialId,
          percentage: i.percentage,
          quantity: 0, // Calculated per batch
        })),
      },
    },
    include: { ingredients: true },
  });
}

// ─── Production Batches ─────────────────────────────────────────────────────

export async function getBatches(filters?: { status?: string; productId?: string }) {
  const where: Prisma.ProductionBatchWhereInput = {};
  if (filters?.status) where.status = filters.status as any;
  if (filters?.productId) where.productId = filters.productId;

  return db.productionBatch.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      recipe: { select: { name: true, code: true } },
      employee: { include: { user: { select: { name: true } } } },
      materials: { include: { rawMaterial: { select: { name: true, code: true } } } },
      _count: { select: { wastages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBatch(data: BatchCreateInput, userId: string) {
  return db.$transaction(async (tx) => {
    const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;

    // Calculate expected yield from recipe
    let expectedYield = data.rawMaterialQty;
    if (data.recipeId) {
      const recipe = await tx.blendRecipe.findUnique({ where: { id: data.recipeId } });
      if (recipe) expectedYield = data.rawMaterialQty * (Number(recipe.targetYield) / 100);
    }

    const batch = await tx.productionBatch.create({
      data: {
        batchNumber,
        productId: data.productId,
        recipeId: data.recipeId,
        employeeId: data.employeeId,
        rawMaterialQty: data.rawMaterialQty,
        outputQty: 0,
        expectedYield,
        startDate: new Date(data.startDate),
        notes: data.notes,
        materials: data.materials ? {
          create: data.materials.map((m) => ({
            rawMaterialId: m.rawMaterialId,
            quantityUsed: m.quantityUsed,
          })),
        } : undefined,
      },
    });

    // Deduct raw materials
    if (data.materials) {
      for (const mat of data.materials) {
        const material = await tx.rawMaterial.findUnique({ where: { id: mat.rawMaterialId } });
        if (!material) throw new Error(`Raw material not found`);
        if (Number(material.quantity) < mat.quantityUsed) throw new Error(`Insufficient stock for ${material.name}`);

        await tx.rawMaterial.update({
          where: { id: mat.rawMaterialId },
          data: { quantity: { decrement: mat.quantityUsed } },
        });
      }
    }

    await tx.auditLog.create({
      data: { userId, action: "CREATE", entity: "ProductionBatch", entityId: batch.id, newData: { batchNumber, rawMaterialQty: data.rawMaterialQty } },
    });

    return batch;
  });
}

export async function updateBatchStatus(id: string, data: BatchStatusInput, userId: string) {
  return db.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({ where: { id } });
    if (!batch) throw new Error("Batch not found");

    const updateData: any = { status: data.status };

    if (data.status === "IN_PROGRESS" && batch.status === "PENDING") {
      updateData.startDate = new Date();
    }

    if (data.status === "COMPLETED") {
      updateData.endDate = data.endDate ? new Date(data.endDate) : new Date();
      updateData.completedAt = new Date();
      if (data.outputQty !== undefined) {
        updateData.outputQty = data.outputQty;
        updateData.actualYield = batch.rawMaterialQty ? (data.outputQty / Number(batch.rawMaterialQty)) * 100 : 0;
      }
    }

    const updated = await tx.productionBatch.update({ where: { id }, data: updateData });

    await tx.auditLog.create({
      data: { userId, action: "STATUS_CHANGE", entity: "ProductionBatch", entityId: id, oldData: { status: batch.status }, newData: { status: data.status } },
    });

    return updated;
  });
}

export async function getBatchById(id: string) {
  return db.productionBatch.findUnique({
    where: { id },
    include: {
      product: true,
      recipe: { include: { ingredients: { include: { rawMaterial: true } } } },
      employee: { include: { user: { select: { name: true } } } },
      materials: { include: { rawMaterial: true } },
      wastages: { include: { employee: { include: { user: { select: { name: true } } } } } },
      inventoryItems: { include: { warehouse: true } },
    },
  });
}

// ─── Packaging ──────────────────────────────────────────────────────────────

export async function updatePackaging(data: PackagingInput, userId: string) {
  return db.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({ where: { id: data.batchId } });
    if (!batch) throw new Error("Batch not found");
    if (batch.status !== "COMPLETED") throw new Error("Batch must be completed before packaging");

    const updated = await tx.productionBatch.update({
      where: { id: data.batchId },
      data: {
        packagingType: data.packagingType,
        packagingQty: data.packagingQty,
        packagingStatus: data.status,
      },
    });

    // When packaging is completed, move to finished goods inventory
    if (data.status === "COMPLETED" && data.warehouseId) {
      await tx.inventoryItem.create({
        data: {
          productId: batch.productId,
          warehouseId: data.warehouseId,
          batchId: batch.id,
          quantity: Number(batch.outputQty),
          costPerUnit: Number(batch.rawMaterialQty) > 0
            ? (Number(batch.rawMaterialQty) * 100) / Number(batch.outputQty) // simplified cost calc
            : 0,
        },
      });

      // Record inbound stock movement
      await tx.stockMovement.create({
        data: {
          type: "INBOUND",
          productId: batch.productId,
          toWarehouseId: data.warehouseId,
          quantity: Number(batch.outputQty),
          batchNumber: batch.batchNumber,
          reference: `Production ${batch.batchNumber}`,
          notes: `Packaged: ${data.packagingQty} x ${data.packagingType}`,
        },
      });
    }

    await tx.auditLog.create({
      data: { userId, action: "PACKAGING_UPDATE", entity: "ProductionBatch", entityId: data.batchId, newData: data as any },
    });

    return updated;
  });
}

// ─── Wastage ────────────────────────────────────────────────────────────────

export async function recordWastage(data: WastageInput, userId: string) {
  return db.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({ where: { id: data.batchId } });
    if (!batch) throw new Error("Batch not found");

    const wastage = await tx.wastage.create({ data });

    await tx.auditLog.create({
      data: { userId, action: "WASTAGE_RECORDED", entity: "Wastage", entityId: wastage.id, newData: data as any },
    });

    return wastage;
  });
}

export async function getWastageByBatch(batchId: string) {
  return db.wastage.findMany({
    where: { batchId },
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: { reportedAt: "desc" },
  });
}

export async function getWastageSummary() {
  return db.$queryRaw<{ category: string; total: number; count: number }[]>`
    SELECT category, SUM(quantity)::float as total, COUNT(*)::int as count
    FROM "Wastage"
    WHERE "reportedAt" >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY total DESC
  `;
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getProductionStats() {
  const [activeBatches, completedThisMonth, totalOutput, avgYield] = await Promise.all([
    db.productionBatch.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "QUALITY_CHECK"] } } }),
    db.productionBatch.count({ where: { status: "COMPLETED", completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    db.productionBatch.aggregate({ where: { status: "COMPLETED", completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { outputQty: true } }),
    db.productionBatch.aggregate({ where: { status: "COMPLETED", actualYield: { not: null } }, _avg: { actualYield: true } }),
  ]);

  return {
    activeBatches,
    completedThisMonth,
    totalOutputThisMonth: Number(totalOutput._sum.outputQty ?? 0),
    avgYield: Number(avgYield._avg.actualYield ?? 0),
  };
}
