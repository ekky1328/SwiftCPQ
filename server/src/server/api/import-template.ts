import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const importTemplateRouter = express.Router();

function formatTemplate(row: Record<string, any>) {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    name: row.name,
    columnMapping: row.column_mapping,
    delimiter: row.delimiter,
    hasHeaderRow: row.has_header_row,
    isActive: row.is_active,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

/**
 * GET /api/v1/import-template
 * Lists all active import templates for the tenant. Supports ?supplierId= filter.
 */
importTemplateRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    let query = db('import_template')
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .orderBy('name', 'asc');

    const supplierId = req.query.supplierId as string | undefined;
    if (supplierId) {
      query = query.where('supplier_id', supplierId);
    }

    const rows = await query;
    res.json(rows.map(formatTemplate));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/import-template/:id
 */
importTemplateRouter.get<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('import_template').where('id', id).first();

    if (!row) { res.status(404).json({ message: 'Import template not found' }); return; }

    res.json(formatTemplate(row));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/import-template
 */
importTemplateRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { supplierId, name, columnMapping, delimiter, hasHeaderRow } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    if (!columnMapping || !columnMapping.sku) {
      res.status(400).json({ message: 'Column mapping with at least a "sku" field is required' });
      return;
    }

    const [row] = await db('import_template').insert({
      tenant_id: tenantId,
      supplier_id: supplierId || null,
      name: name.trim(),
      column_mapping: JSON.stringify(columnMapping),
      delimiter: delimiter ?? ',',
      has_header_row: hasHeaderRow ?? true,
    }).returning('*');

    res.status(201).json(formatTemplate(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/import-template/:id
 */
importTemplateRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('import_template').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Import template not found' }); return; }

    const { supplierId, name, columnMapping, delimiter, hasHeaderRow, isActive } = req.body;

    const update: Record<string, unknown> = {};
    if (supplierId !== undefined) update.supplier_id = supplierId || null;
    if (name !== undefined) update.name = name.trim();
    if (columnMapping !== undefined) update.column_mapping = JSON.stringify(columnMapping);
    if (delimiter !== undefined) update.delimiter = delimiter;
    if (hasHeaderRow !== undefined) update.has_header_row = hasHeaderRow;
    if (isActive !== undefined) update.is_active = isActive;

    const [row] = await db('import_template').where('id', id).update(update).returning('*');
    res.json(formatTemplate(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/import-template/:id
 * Soft-deletes an import template.
 */
importTemplateRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('import_template').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Import template not found' }); return; }

    await db('import_template').where('id', id).update({ is_active: false });
    res.json({ message: 'Import template deleted' });
  } catch (err) {
    next(err);
  }
});

export default importTemplateRouter;
