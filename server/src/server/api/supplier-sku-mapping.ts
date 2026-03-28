import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const supplierSkuMappingRouter = express.Router();

function formatMapping(row: Record<string, any>) {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierSku: row.supplier_sku,
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
    supplierId: row.supplier_id,
    supplierSku: row.supplier_sku,
    catalogueItemId: row.catalogue_item_id,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

/**
 * GET /api/v1/supplier-sku-mapping
 * Lists SKU mappings. Requires ?supplierId= query param.
 */
supplierSkuMappingRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const supplierId = req.query.supplierId as string | undefined;
    if (!supplierId) {
      res.status(400).json({ message: 'supplierId query parameter is required' });
      return;
    }

    const rows = await db('supplier_sku_mapping')
      .select(
        'supplier_sku_mapping.*',
        'catalogue_item.sku as catalogue_sku',
        'catalogue_item.title as catalogue_title',
      )
      .leftJoin('catalogue_item', 'supplier_sku_mapping.catalogue_item_id', 'catalogue_item.id')
      .where('supplier_sku_mapping.tenant_id', tenantId)
      .where('supplier_sku_mapping.supplier_id', supplierId)
      .orderBy('supplier_sku_mapping.supplier_sku', 'asc');

    res.json(rows.map(formatMapping));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/supplier-sku-mapping
 */
supplierSkuMappingRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { supplierId, supplierSku, catalogueItemId } = req.body;

    if (!supplierId || !supplierSku?.trim() || !catalogueItemId) {
      res.status(400).json({ message: 'supplierId, supplierSku, and catalogueItemId are required' });
      return;
    }

    const [row] = await db('supplier_sku_mapping').insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      supplier_sku: supplierSku.trim(),
      catalogue_item_id: catalogueItemId,
    }).returning('*');

    res.status(201).json(formatMappingSimple(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/supplier-sku-mapping/:id
 */
supplierSkuMappingRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('supplier_sku_mapping').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'SKU mapping not found' }); return; }

    const { supplierSku, catalogueItemId } = req.body;

    const update: Record<string, unknown> = {};
    if (supplierSku !== undefined)     update.supplier_sku = supplierSku.trim();
    if (catalogueItemId !== undefined) update.catalogue_item_id = catalogueItemId;

    const [row] = await db('supplier_sku_mapping').where('id', id).update(update).returning('*');
    res.json(formatMappingSimple(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/supplier-sku-mapping/:id
 */
supplierSkuMappingRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('supplier_sku_mapping').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'SKU mapping not found' }); return; }

    await db('supplier_sku_mapping').where('id', id).delete();
    res.json({ message: 'SKU mapping deleted' });
  } catch (err) {
    next(err);
  }
});

export default supplierSkuMappingRouter;
