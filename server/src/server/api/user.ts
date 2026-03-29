import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';
import { hashPassword } from '../helpers/passwords';

const userRouter = express.Router();


/**
 * Maps a user row with optional contact/location joins to a response object.
 */
function mapUserResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title || '',
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    description: row.description || '',
    isActive: row.is_active,
    isSuperAdmin: row.is_super_admin,
    email: (row.contact_email as string) || (row.username as string),
    phone: (row.contact_phone as string) || '',
    createdOnDate: row.created_on_date,
    modifiedOnDate: row.modified_on_date,
  };
}


/**
 * Method: GET
 * Endpoint: /api/v1/user/
 * - Gets a list of users
 */
userRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;

    const rows = await db('user')
      .select(
        'user.id', 'user.title', 'user.first_name', 'user.last_name',
        'user.username', 'user.description', 'user.is_active', 'user.is_super_admin',
        'user.created_on_date', 'user.modified_on_date',
        'user_contact.email as contact_email', 'user_contact.phone as contact_phone',
      )
      .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
      .where('user.tenant_id', tenantId);

    res.json(rows.map(mapUserResponse));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/user/:id
 * - Gets the user JSON based on the :id with contacts and locations
 */
userRouter.get<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const row = await db('user')
      .select(
        'user.id', 'user.title', 'user.first_name', 'user.last_name',
        'user.username', 'user.description', 'user.is_active', 'user.is_super_admin',
        'user.created_on_date', 'user.modified_on_date',
        'user_contact.email as contact_email', 'user_contact.phone as contact_phone',
      )
      .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
      .where('user.id', id)
      .first();

    if (!row) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get contacts
    const contacts = await db('user_contact')
      .where('user_id', id)
      .orderBy('created_on_date');

    // Get locations
    const locations = await db('user_location')
      .where('user_id', id)
      .orderBy('created_on_date');

    res.json({
      ...mapUserResponse(row),
      contacts: contacts.map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        createdOnDate: c.created_on_date,
        modifiedOnDate: c.modified_on_date,
      })),
      locations: locations.map((l: Record<string, unknown>) => ({
        id: l.id,
        addressLine1: l.address_line1,
        addressLine2: l.address_line2 || '',
        city: l.city,
        state: l.state,
        zipCode: l.zip_code,
        country: l.country,
        createdOnDate: l.created_on_date,
        modifiedOnDate: l.modified_on_date,
      })),
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/user/
 * - Creates a new user
 */
userRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { title, firstName, lastName, username, password, description } = req.body;

    if (!firstName || !lastName || !username || !password) {
      res.status(400).json({ message: 'firstName, lastName, username, and password are required' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [{ id: userId }] = await db('user').insert({
      tenant_id: tenantId,
      title: title || '',
      first_name: firstName,
      last_name: lastName,
      username,
      password_hash: passwordHash,
      description: description || '',
    }).returning('id');

    const user = await db('user').where('id', userId).first();
    res.status(201).json({
      id: user.id,
      title: user.title,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      description: user.description,
      isActive: user.is_active,
      isSuperAdmin: user.is_super_admin,
      createdOnDate: user.created_on_date,
      modifiedOnDate: user.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/user/:id
 * - Updates a user
 */
userRouter.put<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { title, firstName, lastName, username, password, description, isActive } = req.body;

    const existing = await db('user').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (username !== undefined) updateData.username = username;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (password !== undefined) updateData.password_hash = await hashPassword(password);

    await db('user').where('id', id).update(updateData);
    const user = await db('user').where('id', id).first();

    res.json({
      id: user.id,
      title: user.title,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      description: user.description,
      isActive: user.is_active,
      isSuperAdmin: user.is_super_admin,
      createdOnDate: user.created_on_date,
      modifiedOnDate: user.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/user/:id
 * - Deletes a user
 */
userRouter.delete<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await db('user').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await db('user').where('id', id).del();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});


// =============================================================================
// USER CONTACT ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/user/:id/contact
 * - Gets all contacts for a user
 */
userRouter.get<{}, MessageResponse>('/:id/contact', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const user = await db('user').where('id', id).first();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const contacts = await db('user_contact')
      .where('user_id', id)
      .orderBy('created_on_date');

    res.json(contacts.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdOnDate: c.created_on_date,
      modifiedOnDate: c.modified_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/user/:id/contact
 * - Creates a new contact for a user
 */
userRouter.post<{}, MessageResponse>('/:id/contact', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params as { id: string };
    const { name, email, phone } = req.body;

    const user = await db('user').where('id', id).first();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!name || !email || !phone) {
      res.status(400).json({ message: 'name, email, and phone are required' });
      return;
    }

    const [{ id: contactId }] = await db('user_contact').insert({
      tenant_id: tenantId,
      user_id: id,
      name,
      email,
      phone,
    }).returning('id');

    const contact = await db('user_contact').where('id', contactId).first();
    res.status(201).json({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      createdOnDate: contact.created_on_date,
      modifiedOnDate: contact.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/user/:id/contact/:contactId
 * - Updates a user contact
 */
userRouter.put<{}, MessageResponse>('/:id/contact/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params as { id: string; contactId: string };
    const { name, email, phone } = req.body;

    const existing = await db('user_contact').where('id', contactId).first();
    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    await db('user_contact').where('id', contactId).update(updateData);
    const contact = await db('user_contact').where('id', contactId).first();

    res.json({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      createdOnDate: contact.created_on_date,
      modifiedOnDate: contact.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/user/:id/contact/:contactId
 * - Deletes a user contact
 */
userRouter.delete<{}, MessageResponse>('/:id/contact/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params as { id: string; contactId: string };

    const existing = await db('user_contact').where('id', contactId).first();
    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    await db('user_contact').where('id', contactId).del();
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    next(err);
  }
});


// =============================================================================
// USER LOCATION ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/user/:id/location
 * - Gets all locations for a user
 */
userRouter.get<{}, MessageResponse>('/:id/location', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const user = await db('user').where('id', id).first();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const locations = await db('user_location')
      .where('user_id', id)
      .orderBy('created_on_date');

    res.json(locations.map((l: Record<string, unknown>) => ({
      id: l.id,
      addressLine1: l.address_line1,
      addressLine2: l.address_line2 || '',
      city: l.city,
      state: l.state,
      zipCode: l.zip_code,
      country: l.country,
      createdOnDate: l.created_on_date,
      modifiedOnDate: l.modified_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/user/:id/location
 * - Creates a new location for a user
 */
userRouter.post<{}, MessageResponse>('/:id/location', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params as { id: string };
    const { addressLine1, addressLine2, city, state, zipCode, country } = req.body;

    const user = await db('user').where('id', id).first();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!addressLine1 || !city || !state || !zipCode || !country) {
      res.status(400).json({ message: 'addressLine1, city, state, zipCode, and country are required' });
      return;
    }

    const [{ id: locationId }] = await db('user_location').insert({
      tenant_id: tenantId,
      user_id: id,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      state,
      zip_code: zipCode,
      country,
    }).returning('id');

    const location = await db('user_location').where('id', locationId).first();
    res.status(201).json({
      id: location.id,
      addressLine1: location.address_line1,
      addressLine2: location.address_line2 || '',
      city: location.city,
      state: location.state,
      zipCode: location.zip_code,
      country: location.country,
      createdOnDate: location.created_on_date,
      modifiedOnDate: location.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/user/:id/location/:locationId
 * - Updates a user location
 */
userRouter.put<{}, MessageResponse>('/:id/location/:locationId', async (req, res, next) => {
  try {
    const { locationId } = req.params as { id: string; locationId: string };
    const { addressLine1, addressLine2, city, state, zipCode, country } = req.body;

    const existing = await db('user_location').where('id', locationId).first();
    if (!existing) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (addressLine1 !== undefined) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zip_code = zipCode;
    if (country !== undefined) updateData.country = country;

    await db('user_location').where('id', locationId).update(updateData);
    const location = await db('user_location').where('id', locationId).first();

    res.json({
      id: location.id,
      addressLine1: location.address_line1,
      addressLine2: location.address_line2 || '',
      city: location.city,
      state: location.state,
      zipCode: location.zip_code,
      country: location.country,
      createdOnDate: location.created_on_date,
      modifiedOnDate: location.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/user/:id/location/:locationId
 * - Deletes a user location
 */
userRouter.delete<{}, MessageResponse>('/:id/location/:locationId', async (req, res, next) => {
  try {
    const { locationId } = req.params as { id: string; locationId: string };

    const existing = await db('user_location').where('id', locationId).first();
    if (!existing) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    await db('user_location').where('id', locationId).del();
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    next(err);
  }
});


export default userRouter;
