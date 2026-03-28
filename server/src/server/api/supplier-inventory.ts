import express from 'express';

import db from '../../database/db';
import { fromCents } from '../helpers/money';
import MessageResponse from '../interfaces/MessageResponse';

const supplierInventoryRouter = express.Router();

function formatInventory(row: Record<string, any>) {
  return {
    id: row.id,
    catalogueItemId: row.catalogue_item_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    supplierCode: row.supplier_code,
    supplierSku: row.supplier_sku,
    stockLevel: row.stock_level,
    costPrice: fromCents(row.cost_price),
    lastSyncedAt: row.last_synced_at,
    isActive: row.is_active,
  };
}

/**
 * GET /api/v1/supplier-inventory
 * Query supplier inventory records.
 * Requires either ?catalogueItemId= or ?supplierId= query param.
 */
supplierInventoryRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const catalogueItemId = req.query.catalogueItemId as string | undefined;
    const supplierId = req.query.supplierId as string | undefined;

    if (!catalogueItemId && !supplierId) {
      res.status(400).json({ message: 'Either catalogueItemId or supplierId query parameter is required' });
      return;
    }

    let query = db('supplier_inventory')
      .select(
        'supplier_inventory.*',
        'supplier.name as supplier_name',
        'supplier.code as supplier_code',
      )
      .join('supplier', 'supplier_inventory.supplier_id', 'supplier.id')
      .where('supplier_inventory.tenant_id', tenantId)
      .where('supplier_inventory.is_active', true);

    if (catalogueItemId) {
      query = query.where('supplier_inventory.catalogue_item_id', catalogueItemId);
    }

    if (supplierId) {
      query = query.where('supplier_inventory.supplier_id', supplierId);
    }

    query = query.orderBy('supplier.name', 'asc');

    const rows = await query;
    res.json(rows.map(formatInventory));
  } catch (err) {
    next(err);
  }
});

export default supplierInventoryRouter;
