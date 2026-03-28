import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const vendorSkuMappingRouter = express.Router();

function formatMapping(row: Record<string, any>) {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorSku: row.vendor_sku,
    catalogueItemId: row.catalogue_item_id,
    catalogueItemSku: row.catalogue_sku,
    catalogueItemTitle: row.catalogue_title,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

function formatMappingSimple(row: Record<string, any>) {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    vendorSku: row.vendor_sku,
    catalogueItemId: row.catalogue_item_id,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

/**
 * GET /api/v1/vendor-sku-mapping
 * Lists SKU mappings. Requires ?vendorId= query param.
 */
vendorSkuMappingRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const vendorId = req.query.vendorId as string | undefined;
    if (!vendorId) {
      res.status(400).json({ message: 'vendorId query parameter is required' });
      return;
    }

    const rows = await db('vendor_sku_mapping')
      .select(
        'vendor_sku_mapping.*',
        'catalogue_item.sku as catalogue_sku',
        'catalogue_item.title as catalogue_title',
      )
      .leftJoin('catalogue_item', 'vendor_sku_mapping.catalogue_item_id', 'catalogue_item.id')
      .where('vendor_sku_mapping.tenant_id', tenantId)
      .where('vendor_sku_mapping.vendor_id', vendorId)
      .orderBy('vendor_sku_mapping.vendor_sku', 'asc');

    res.json(rows.map(formatMapping));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/vendor-sku-mapping
 */
vendorSkuMappingRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { vendorId, vendorSku, catalogueItemId } = req.body;

    if (!vendorId || !vendorSku?.trim() || !catalogueItemId) {
      res.status(400).json({ message: 'vendorId, vendorSku, and catalogueItemId are required' });
      return;
    }

    const [row] = await db('vendor_sku_mapping').insert({
      tenant_id: tenantId,
      vendor_id: vendorId,
      vendor_sku: vendorSku.trim(),
      catalogue_item_id: catalogueItemId,
    }).returning('*');

    res.status(201).json(formatMappingSimple(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/vendor-sku-mapping/:id
 */
vendorSkuMappingRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('vendor_sku_mapping').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'SKU mapping not found' }); return; }

    const { vendorSku, catalogueItemId } = req.body;

    const update: Record<string, unknown> = {};
    if (vendorSku !== undefined)      update.vendor_sku = vendorSku.trim();
    if (catalogueItemId !== undefined) update.catalogue_item_id = catalogueItemId;

    const [row] = await db('vendor_sku_mapping').where('id', id).update(update).returning('*');
    res.json(formatMappingSimple(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/vendor-sku-mapping/:id
 */
vendorSkuMappingRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('vendor_sku_mapping').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'SKU mapping not found' }); return; }

    await db('vendor_sku_mapping').where('id', id).delete();
    res.json({ message: 'SKU mapping deleted' });
  } catch (err) {
    next(err);
  }
});

export default vendorSkuMappingRouter;
