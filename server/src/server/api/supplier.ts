import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const supplierRouter = express.Router();

function formatSupplier(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

/**
 * GET /api/v1/supplier
 * Lists all active suppliers for the tenant.
 */
supplierRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const rows = await db('supplier')
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .orderBy('name', 'asc');

    res.json(rows.map(formatSupplier));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/supplier/:id
 */
supplierRouter.get<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('supplier').where('id', id).first();

    if (!row) { res.status(404).json({ message: 'Supplier not found' }); return; }

    res.json(formatSupplier(row));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/supplier
 */
supplierRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { name, code } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const [row] = await db('supplier').insert({
      tenant_id: tenantId,
      name: name.trim(),
      code: code?.trim() ?? '',
    }).returning('*');

    res.status(201).json(formatSupplier(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/supplier/:id
 */
supplierRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('supplier').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Supplier not found' }); return; }

    const { name, code, isActive } = req.body;

    const update: Record<string, unknown> = {};
    if (name !== undefined)     update.name = name.trim();
    if (code !== undefined)     update.code = code.trim();
    if (isActive !== undefined) update.is_active = isActive;

    const [row] = await db('supplier').where('id', id).update(update).returning('*');
    res.json(formatSupplier(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/supplier/:id
 * Soft-deletes a supplier.
 */
supplierRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('supplier').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Supplier not found' }); return; }

    await db('supplier').where('id', id).update({ is_active: false });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
});

export default supplierRouter;
