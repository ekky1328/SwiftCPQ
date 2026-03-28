import express from 'express';

import db from '../../database/db';
import { fromCents } from '../helpers/money';
import MessageResponse from '../interfaces/MessageResponse';

const vendorInventoryRouter = express.Router();

function formatInventory(row: Record<string, any>) {
  return {
    id: row.id,
    catalogueItemId: row.catalogue_item_id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorCode: row.vendor_code,
    vendorSku: row.vendor_sku,
    stockLevel: row.stock_level,
    costPrice: fromCents(row.cost_price),
    lastSyncedAt: row.last_synced_at,
    isActive: row.is_active,
  };
}

/**
 * GET /api/v1/vendor-inventory
 * Query vendor inventory records.
 * Requires either ?catalogueItemId= or ?vendorId= query param.
 */
vendorInventoryRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const catalogueItemId = req.query.catalogueItemId as string | undefined;
    const vendorId = req.query.vendorId as string | undefined;

    if (!catalogueItemId && !vendorId) {
      res.status(400).json({ message: 'Either catalogueItemId or vendorId query parameter is required' });
      return;
    }

    let query = db('vendor_inventory')
      .select(
        'vendor_inventory.*',
        'vendor.name as vendor_name',
        'vendor.code as vendor_code',
      )
      .join('vendor', 'vendor_inventory.vendor_id', 'vendor.id')
      .where('vendor_inventory.tenant_id', tenantId)
      .where('vendor_inventory.is_active', true);

    if (catalogueItemId) {
      query = query.where('vendor_inventory.catalogue_item_id', catalogueItemId);
    }

    if (vendorId) {
      query = query.where('vendor_inventory.vendor_id', vendorId);
    }

    query = query.orderBy('vendor.name', 'asc');

    const rows = await query;
    res.json(rows.map(formatInventory));
  } catch (err) {
    next(err);
  }
});

export default vendorInventoryRouter;
