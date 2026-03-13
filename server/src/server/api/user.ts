import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const userRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/user/
 * - Gets a list of users
 */
userRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenant = await db('tenant').where('status', 'ACTIVE').first();
    if (!tenant) {
      res.status(404).json({ message: 'No active tenant found' });
      return;
    }

    const rows = await db('user')
      .select(
        'user.id', 'user.first_name', 'user.last_name', 'user.username',
        'user_contact.email as contact_email', 'user_contact.phone as contact_phone',
      )
      .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
      .where('user.tenant_id', tenant.id);

    const users = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: (row.contact_email as string) || (row.username as string),
      phone: (row.contact_phone as string) || '',
    }));

    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * Method: GET
 * Endpoint: /api/v1/user/:id
 * - Gets the user JSON based on the :id
 */
userRouter.get<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const row = await db('user')
      .select(
        'user.id', 'user.first_name', 'user.last_name', 'user.username',
        'user_contact.email as contact_email', 'user_contact.phone as contact_phone',
      )
      .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
      .where('user.id', id)
      .first();

    if (!row) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.contact_email || row.username,
      phone: row.contact_phone || '',
    });
  } catch (err) {
    next(err);
  }
});

export default userRouter;
