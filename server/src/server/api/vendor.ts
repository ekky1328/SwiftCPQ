import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const vendorRouter = express.Router();

function formatVendor(row: Record<string, any>) {
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
 * GET /api/v1/vendor
 * Lists all active vendors for the tenant.
 */
vendorRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const rows = await db('vendor')
      .where('tenant_id', tenantId)
      .where('is_active', true)
      .orderBy('name', 'asc');

    res.json(rows.map(formatVendor));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/vendor/:id
 */
vendorRouter.get<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('vendor').where('id', id).first();

    if (!row) { res.status(404).json({ message: 'Vendor not found' }); return; }

    res.json(formatVendor(row));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/vendor
 */
vendorRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { name, code } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const [row] = await db('vendor').insert({
      tenant_id: tenantId,
      name: name.trim(),
      code: code?.trim() ?? '',
    }).returning('*');

    res.status(201).json(formatVendor(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/vendor/:id
 */
vendorRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('vendor').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Vendor not found' }); return; }

    const { name, code, isActive } = req.body;

    const update: Record<string, unknown> = {};
    if (name !== undefined)     update.name = name.trim();
    if (code !== undefined)     update.code = code.trim();
    if (isActive !== undefined) update.is_active = isActive;

    const [row] = await db('vendor').where('id', id).update(update).returning('*');
    res.json(formatVendor(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/vendor/:id
 * Soft-deletes a vendor.
 */
vendorRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('vendor').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Vendor not found' }); return; }

    await db('vendor').where('id', id).update({ is_active: false });
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    next(err);
  }
});

export default vendorRouter;
