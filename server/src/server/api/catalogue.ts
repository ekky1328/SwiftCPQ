import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';
import { fromCents, toCents } from '../helpers/money';

const catalogueRouter = express.Router();

function formatItem(row: Record<string, any>) {
  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    description: row.description,
    cost: fromCents(row.cost),
    price: fromCents(row.price),
    type: row.type,
    isActive: row.is_active,
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}

/**
 * GET /api/v1/catalogue
 * Lists all active catalogue items for the tenant. Supports ?search= query param.
 */
catalogueRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      const tenant = await db('tenant').where('status', 'ACTIVE').first();
      if (!tenant) { res.status(404).json({ message: 'No active tenant found' }); return; }
    }

    const resolvedTenantId = tenantId ?? (await db('tenant').where('status', 'ACTIVE').first())?.id;
    const search = req.query.search as string | undefined;

    let query = db('catalogue_item')
      .where('tenant_id', resolvedTenantId)
      .where('is_active', true)
      .orderBy('title', 'asc');

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.where((builder) => {
        builder.whereILike('title', term).orWhereILike('sku', term).orWhereILike('description', term);
      });
    }

    const rows = await query;
    res.json(rows.map(formatItem));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/catalogue/:id
 * Returns a single catalogue item.
 */
catalogueRouter.get<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await db('catalogue_item').where('id', id).first();

    if (!row) { res.status(404).json({ message: 'Catalogue item not found' }); return; }

    res.json(formatItem(row));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/catalogue
 * Creates a new catalogue item.
 */
catalogueRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const { sku, title, description, cost, price, type } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const tenantId = req.user?.tenantId
      ?? (await db('tenant').where('status', 'ACTIVE').first())?.id;

    if (!tenantId) { res.status(404).json({ message: 'No active tenant found' }); return; }

    const [row] = await db('catalogue_item').insert({
      tenant_id: tenantId,
      sku: sku?.trim() ?? '',
      title: title.trim(),
      description: description?.trim() ?? '',
      cost: toCents(Number(cost) || 0),
      price: toCents(Number(price) || 0),
      type: type ?? 'PRODUCT',
    }).returning('*');

    res.status(201).json(formatItem(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/catalogue/:id
 * Updates a catalogue item.
 */
catalogueRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('catalogue_item').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Catalogue item not found' }); return; }

    const { sku, title, description, cost, price, type, isActive } = req.body;

    const update: Record<string, unknown> = {};
    if (sku !== undefined)         update.sku = sku.trim();
    if (title !== undefined)       update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (cost !== undefined)        update.cost = toCents(Number(cost));
    if (price !== undefined)       update.price = toCents(Number(price));
    if (type !== undefined)        update.type = type;
    if (isActive !== undefined)    update.is_active = isActive;

    const [row] = await db('catalogue_item').where('id', id).update(update).returning('*');
    res.json(formatItem(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/catalogue/:id
 * Soft-deletes a catalogue item (sets is_active = false).
 */
catalogueRouter.delete<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('catalogue_item').where('id', id).first();
    if (!existing) { res.status(404).json({ message: 'Catalogue item not found' }); return; }

    await db('catalogue_item').where('id', id).update({ is_active: false });
    res.json({ message: 'Catalogue item deleted' });
  } catch (err) {
    next(err);
  }
});

export default catalogueRouter;
