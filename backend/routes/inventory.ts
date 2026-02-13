import express, { type Router, type Request, type Response } from 'express';
import { prisma } from '@/prismaClient';
import { inventoryService } from '@/utils/inventoryService';
import { logger } from "@/utils/logger";
import { Prisma } from '@prisma/client';
import decimalCalc from '@/utils/decimalCalculator';

const router: Router = express.Router();

/**
 * GET /api/inventory
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_model, page = 1, limit = 10 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Filter
    const where: Prisma.InventoryWhereInput = {};
    if (product_model) {
      where.product_model = { contains: String(product_model) };
    }

    // Query DB
    const [rows, total] = await prisma.$transaction([
      prisma.inventory.findMany({
        where,
        orderBy: { product_model: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.inventory.count({ where })
    ]);

    // Enhance with Last In/Out dates
    // For small batch (limit 10), it's okay to query individually or group query
    const results = await Promise.all(rows.map(async (row) => {
        // Find last Inbound date
        const lastIn = await prisma.inventoryLedger.findFirst({
            where: { product_model: row.product_model, change_type: 'INBOUND' },
            orderBy: { date: 'desc' },
            select: { date: true }
        });
        // Find last Outbound date
        const lastOut = await prisma.inventoryLedger.findFirst({
            where: { product_model: row.product_model, change_type: 'OUTBOUND' },
            orderBy: { date: 'desc' },
            select: { date: true }
        });
        
        return {
            product_model: row.product_model,
            current_inventory: row.quantity,
            last_inbound: lastIn ? lastIn.date : null,
            last_outbound: lastOut ? lastOut.date : null,
            last_update: new Date().toISOString() // Dynamic
        };
    }));

    res.json({
        data: results,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });

  } catch (err: any) {
    logger.error(`Failed to get inventory: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventory/total-cost-estimate
 */
router.get('/total-cost-estimate', async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get all inventory > 0
    const items = await prisma.inventory.findMany({
        where: { quantity: { gt: 0 } }
    });

    let totalCost = decimalCalc.decimal(0);

    // This loop might be slow if thousands of products, but typically fine for SMB
    for (const item of items) {
       // Get latest purchase price
       const priceRow = await prisma.inboundRecord.findFirst({
           where: { product_model: item.product_model },
           orderBy: [{ inbound_date: 'desc' }, { id: 'desc' }],
           select: { unit_price: true }
       });
       
       if (priceRow && priceRow.unit_price) {
           const infoCost = decimalCalc.multiply(item.quantity, priceRow.unit_price);
           totalCost = decimalCalc.add(totalCost, infoCost);
       }
    }

    res.json({ 
      total_cost_estimate: decimalCalc.toDbNumber(totalCost, 2),
      last_updated: new Date().toISOString() 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/inventory/refresh
 */
router.post('/refresh', async (_req: Request, res: Response): Promise<void> => {
  try {
      const result = await inventoryService.recalculateAll();
      res.json({ 
          success: true, 
          message: 'Inventory recalculation completed!',
          last_updated: new Date().toISOString(),
          products_count: result.products_count
      });
  } catch (err: any) {
      res.status(500).json({ error: err.message });
  }
});

export default router;
