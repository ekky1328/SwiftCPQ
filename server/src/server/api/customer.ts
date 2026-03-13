import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const customerRouter = express.Router();


/**
 * Helper to get the default tenant ID.
 */
async function getDefaultTenantId(): Promise<string> {
  const tenant = await db('tenant').where('status', 'ACTIVE').first();
  if (!tenant) {
    throw new Error('No active tenant found');
  }
  return tenant.id;
}


// =============================================================================
// CUSTOMER ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/customer/
 * - Gets a list of customers
 */
customerRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();

    const rows = await db('customer')
      .select(
        'customer.*',
        'customer_contact.first_name as contact_first_name',
        'customer_contact.last_name as contact_last_name',
        'customer_location.address_line1 as location_street',
        'customer_location.city as location_city',
        'customer_location.state as location_state',
        'customer_location.zip_code as location_postcode',
        'customer_location.country as location_country',
      )
      .leftJoin('customer_contact', 'customer.primary_customer_contact_id', 'customer_contact.id')
      .leftJoin('customer_location', 'customer.primary_customer_location_id', 'customer_location.id')
      .where('customer.tenant_id', tenantId);

    const customers = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      isActive: row.is_active,
      contact: {
        firstName: row.contact_first_name || '',
        lastName: row.contact_last_name || '',
      },
      address: {
        street: row.location_street || '',
        city: row.location_city || '',
        state: row.location_state || '',
        postcode: row.location_postcode || '',
        country: row.location_country || '',
      },
      createdOnDate: row.created_on_date,
      modifiedOnDate: row.modified_on_date,
    }));

    res.json(customers);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/customer/:id
 * - Gets a customer by ID with contacts and locations
 */
customerRouter.get<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const customer = await db('customer').where('id', id).first();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const contacts = await db('customer_contact')
      .where('customer_id', id)
      .orderBy('created_on_date');

    const locations = await db('customer_location')
      .where('customer_id', id)
      .orderBy('created_on_date');

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      isActive: customer.is_active,
      primaryContactId: customer.primary_customer_contact_id,
      primaryLocationId: customer.primary_customer_location_id,
      contacts: contacts.map((c: Record<string, unknown>) => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        isActive: c.is_active,
        locationId: c.location_id,
      })),
      locations: locations.map((l: Record<string, unknown>) => ({
        id: l.id,
        addressLine1: l.address_line1,
        addressLine2: l.address_line2 || '',
        city: l.city,
        state: l.state,
        zipCode: l.zip_code,
        country: l.country,
      })),
      createdOnDate: customer.created_on_date,
      modifiedOnDate: customer.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/customer/
 * - Creates a new customer
 */
customerRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { name, email, phone } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Customer name is required' });
      return;
    }

    const [{ id: customerId }] = await db('customer').insert({
      tenant_id: tenantId,
      name,
      email: email || null,
      phone: phone || null,
    }).returning('id');

    const customer = await db('customer').where('id', customerId).first();
    res.status(201).json({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      isActive: customer.is_active,
      createdOnDate: customer.created_on_date,
      modifiedOnDate: customer.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/customer/:id
 * - Updates a customer
 */
customerRouter.put<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { name, email, phone, isActive, primaryContactId, primaryLocationId } = req.body;

    const existing = await db('customer').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (primaryContactId !== undefined) updateData.primary_customer_contact_id = primaryContactId;
    if (primaryLocationId !== undefined) updateData.primary_customer_location_id = primaryLocationId;

    await db('customer').where('id', id).update(updateData);
    const customer = await db('customer').where('id', id).first();

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      isActive: customer.is_active,
      primaryContactId: customer.primary_customer_contact_id,
      primaryLocationId: customer.primary_customer_location_id,
      createdOnDate: customer.created_on_date,
      modifiedOnDate: customer.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/customer/:id
 * - Deletes a customer
 */
customerRouter.delete<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await db('customer').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    await db('customer').where('id', id).del();
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
});


// =============================================================================
// CUSTOMER CONTACT ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/customer/:id/contact
 * - Gets all contacts for a customer
 */
customerRouter.get<{}, MessageResponse>('/:id/contact', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const customer = await db('customer').where('id', id).first();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const contacts = await db('customer_contact')
      .where('customer_id', id)
      .orderBy('created_on_date');

    res.json(contacts.map((c: Record<string, unknown>) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      isActive: c.is_active,
      locationId: c.location_id,
      createdOnDate: c.created_on_date,
      modifiedOnDate: c.modified_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/customer/:id/contact
 * - Creates a new contact for a customer
 */
customerRouter.post<{}, MessageResponse>('/:id/contact', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = req.params as { id: string };
    const { firstName, lastName, email, phone, role, locationId } = req.body;

    const customer = await db('customer').where('id', id).first();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    if (!firstName || !lastName || !email || !phone || !role) {
      res.status(400).json({ message: 'firstName, lastName, email, phone, and role are required' });
      return;
    }

    const [{ id: contactId }] = await db('customer_contact').insert({
      tenant_id: tenantId,
      customer_id: id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      role,
      location_id: locationId || null,
    }).returning('id');

    const contact = await db('customer_contact').where('id', contactId).first();
    res.status(201).json({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      isActive: contact.is_active,
      locationId: contact.location_id,
      createdOnDate: contact.created_on_date,
      modifiedOnDate: contact.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/customer/:id/contact/:contactId
 * - Updates a customer contact
 */
customerRouter.put<{}, MessageResponse>('/:id/contact/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params as { id: string; contactId: string };
    const { firstName, lastName, email, phone, role, isActive, locationId } = req.body;

    const existing = await db('customer_contact').where('id', contactId).first();
    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (locationId !== undefined) updateData.location_id = locationId;

    await db('customer_contact').where('id', contactId).update(updateData);
    const contact = await db('customer_contact').where('id', contactId).first();

    res.json({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      isActive: contact.is_active,
      locationId: contact.location_id,
      createdOnDate: contact.created_on_date,
      modifiedOnDate: contact.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/customer/:id/contact/:contactId
 * - Deletes a customer contact
 */
customerRouter.delete<{}, MessageResponse>('/:id/contact/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params as { id: string; contactId: string };

    const existing = await db('customer_contact').where('id', contactId).first();
    if (!existing) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    await db('customer_contact').where('id', contactId).del();
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    next(err);
  }
});


// =============================================================================
// CUSTOMER LOCATION ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/customer/:id/location
 * - Gets all locations for a customer
 */
customerRouter.get<{}, MessageResponse>('/:id/location', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const customer = await db('customer').where('id', id).first();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const locations = await db('customer_location')
      .where('customer_id', id)
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
 * Endpoint: /api/v1/customer/:id/location
 * - Creates a new location for a customer
 */
customerRouter.post<{}, MessageResponse>('/:id/location', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = req.params as { id: string };
    const { addressLine1, addressLine2, city, state, zipCode, country } = req.body;

    const customer = await db('customer').where('id', id).first();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    if (!addressLine1 || !city || !state || !zipCode || !country) {
      res.status(400).json({ message: 'addressLine1, city, state, zipCode, and country are required' });
      return;
    }

    const [{ id: locationId }] = await db('customer_location').insert({
      tenant_id: tenantId,
      customer_id: id,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      state,
      zip_code: zipCode,
      country,
    }).returning('id');

    const location = await db('customer_location').where('id', locationId).first();
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
 * Endpoint: /api/v1/customer/:id/location/:locationId
 * - Updates a customer location
 */
customerRouter.put<{}, MessageResponse>('/:id/location/:locationId', async (req, res, next) => {
  try {
    const { locationId } = req.params as { id: string; locationId: string };
    const { addressLine1, addressLine2, city, state, zipCode, country } = req.body;

    const existing = await db('customer_location').where('id', locationId).first();
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

    await db('customer_location').where('id', locationId).update(updateData);
    const location = await db('customer_location').where('id', locationId).first();

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
 * Endpoint: /api/v1/customer/:id/location/:locationId
 * - Deletes a customer location
 */
customerRouter.delete<{}, MessageResponse>('/:id/location/:locationId', async (req, res, next) => {
  try {
    const { locationId } = req.params as { id: string; locationId: string };

    const existing = await db('customer_location').where('id', locationId).first();
    if (!existing) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    await db('customer_location').where('id', locationId).del();
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    next(err);
  }
});


export default customerRouter;
