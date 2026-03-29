import express from 'express';

import db from '../../../database/db';
import MessageResponse from '../../interfaces/MessageResponse';
import { hashPassword } from '../../helpers/passwords';
import { PERMISSIONS } from '../../helpers/permissions';

const adminTenantRouter = express.Router();

const SUBDOMAIN_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * GET /api/v1/admin/tenant
 * Lists all tenants with user counts and admin user info. Optional ?status= filter.
 */
adminTenantRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    let query = db('tenant')
      .select(
        'tenant.*',
        db.raw('(SELECT COUNT(*) FROM "user" WHERE "user".tenant_id = tenant.id)::int AS user_count'),
      )
      .orderBy('tenant.created_on_date', 'desc');

    const status = req.query.status as string | undefined;
    if (status) {
      query = query.where('tenant.status', status.toUpperCase());
    }

    const tenants = await query;

    // Fetch admin users for all tenants that have one
    const adminUserIds = tenants.map((t: any) => t.admin_user_id).filter(Boolean);
    const adminUsers = adminUserIds.length > 0
      ? await db('user').whereIn('id', adminUserIds).select('id', 'first_name', 'last_name', 'username')
      : [];
    const adminUserMap = new Map(adminUsers.map((u: any) => [u.id, u]));

    res.json(tenants.map((t: any) => {
      const admin = adminUserMap.get(t.admin_user_id);
      return {
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        status: t.status,
        statusReason: t.status_reason,
        userCount: t.user_count,
        adminUser: admin ? {
          id: admin.id,
          firstName: admin.first_name,
          lastName: admin.last_name,
          username: admin.username,
        } : null,
        createdOnDate: t.created_on_date,
        modifiedOnDate: t.modified_on_date,
      };
    }));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/tenant/:id
 * Returns full tenant detail including settings, theme, address, contact, and proposal settings.
 */
adminTenantRouter.get<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await db('tenant').where('id', id).first();
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    const settings = await db('tenant_settings').where('tenant_id', id).first();

    const theme = settings?.proposal_settings_default
      ? await db('tenant_theme').where('id', settings.proposal_settings_default).first()
      : null;

    const contact = settings?.contact_information
      ? await db('tenant_contact_information').where('id', settings.contact_information).first()
      : null;

    const address = contact?.address
      ? await db('tenant_address_information').where('id', contact.address).first()
      : null;

    const proposalSettings = settings?.proposal_settings
      ? await db('tenant_proposal_setting').where('id', settings.proposal_settings).first()
      : null;

    const adminUser = tenant.admin_user_id
      ? await db('user').where('id', tenant.admin_user_id).select('id', 'first_name', 'last_name', 'username').first()
      : null;

    const userCount = await db('user').where('tenant_id', id).count('* as count').first();

    res.json({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.status,
      statusReason: tenant.status_reason,
      userCount: Number(userCount?.count ?? 0),
      adminUser: adminUser ? {
        id: adminUser.id,
        firstName: adminUser.first_name,
        lastName: adminUser.last_name,
        username: adminUser.username,
      } : null,
      createdOnDate: tenant.created_on_date,
      modifiedOnDate: tenant.modified_on_date,
      settings: settings ? {
        prefix: settings.prefix,
        suffix: settings.suffix,
        logo: settings.logo,
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.date_format,
        selectedTemplate: settings.selected_template,
        staleInventoryDays: settings.stale_inventory_days ?? 28,
      } : null,
      theme: theme ? {
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
      } : null,
      contactInformation: {
        email: contact?.email || '',
        phone: contact?.phone || '',
        address: {
          street: address?.address_line1 || '',
          city: address?.city || '',
          state: address?.state || '',
          postcode: address?.zip_code || '',
          country: address?.country || '',
        },
      },
      proposalSettings: proposalSettings ? {
        expiry: proposalSettings.expiry,
        tax: proposalSettings.tax,
        taxRate: proposalSettings.tax_rate,
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/tenant
 * Creates a new tenant with full provisioning (settings, theme, permissions, admin role, admin user).
 */
adminTenantRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const { name, subdomain, adminUser } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: 'Tenant name is required' });
      return;
    }

    if (!subdomain?.trim()) {
      res.status(400).json({ message: 'Subdomain is required' });
      return;
    }

    const normalizedSubdomain = subdomain.trim().toLowerCase();
    if (!SUBDOMAIN_REGEX.test(normalizedSubdomain)) {
      res.status(400).json({ message: 'Subdomain must be lowercase alphanumeric with hyphens only' });
      return;
    }

    if (['admin', 'www', 'api', 'app'].includes(normalizedSubdomain)) {
      res.status(400).json({ message: 'This subdomain is reserved' });
      return;
    }

    const existingTenant = await db('tenant').where('subdomain', normalizedSubdomain).first();
    if (existingTenant) {
      res.status(409).json({ message: 'Subdomain is already in use' });
      return;
    }

    if (!adminUser?.firstName?.trim() || !adminUser?.lastName?.trim() || !adminUser?.username?.trim() || !adminUser?.password) {
      res.status(400).json({ message: 'Admin user firstName, lastName, username, and password are required' });
      return;
    }

    const existingUser = await db('user').where('username', adminUser.username.trim()).first();
    if (existingUser) {
      res.status(409).json({ message: 'Username is already in use' });
      return;
    }

    const result = await db.transaction(async (trx) => {

      const [tenant] = await trx('tenant').insert({
        name: name.trim(),
        subdomain: normalizedSubdomain,
        status: 'ACTIVE',
        status_reason: 'Provisioned by super admin',
      }).returning('*');

      const tenantId = tenant.id;

      const [theme] = await trx('tenant_theme').insert({
        tenant_id: tenantId,
        primary: '#ff822d',
        secondary: '#2D7FFF',
        accent: '#CC681F',
      }).returning('id');

      const [address] = await trx('tenant_address_information').insert({
        tenant_id: tenantId,
        address_line1: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
      }).returning('id');

      const [contact] = await trx('tenant_contact_information').insert({
        tenant_id: tenantId,
        address: address.id,
        email: '',
        phone: '',
      }).returning('id');

      const [proposalSettings] = await trx('tenant_proposal_setting').insert({
        tenant_id: tenantId,
        expiry: 14,
        tax: false,
        tax_rate: 10,
      }).returning('id');

      await trx('tenant_settings').insert({
        tenant_id: tenantId,
        prefix: 'S-CPQ',
        suffix: '',
        logo: 'default.svg',
        currency: 'USD',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        selected_template: 'default',
        contact_information: contact.id,
        proposal_settings: proposalSettings.id,
        proposal_settings_default: theme.id,
      });

      const permissionNames = Object.values(PERMISSIONS);
      const permissionInserts = permissionNames.map((pName) => ({
        tenant_id: tenantId,
        name: pName,
        description: pName.replace('.', ' '),
        is_active: true,
      }));
      const permissions = await trx('tenant_permission').insert(permissionInserts).returning('*');

      const [adminRole] = await trx('tenant_role').insert({
        tenant_id: tenantId,
        name: 'Admin',
        description: 'Default administrator role with all permissions',
      }).returning('id');

      const rolePermInserts = permissions.map((p: any) => ({
        tenant_id: tenantId,
        role_id: adminRole.id,
        permission_id: p.id,
      }));
      await trx('tenant_role_permission').insert(rolePermInserts);

      const passwordHash = await hashPassword(adminUser.password);
      const [user] = await trx('user').insert({
        tenant_id: tenantId,
        title: '',
        first_name: adminUser.firstName.trim(),
        last_name: adminUser.lastName.trim(),
        username: adminUser.username.trim(),
        password_hash: passwordHash,
        auth_provider: 'LOCAL',
        is_active: true,
        is_super_admin: false,
        force_password_reset: true,
      }).returning('*');

      await trx('tenant_role_user').insert({
        tenant_id: tenantId,
        role_id: adminRole.id,
        user_id: user.id,
      });

      await trx('tenant').where('id', tenantId).update({ admin_user_id: user.id });

      return { tenant, user };
    });

    res.status(201).json({
      id: result.tenant.id,
      name: result.tenant.name,
      subdomain: result.tenant.subdomain,
      status: result.tenant.status,
      adminUser: {
        id: result.user.id,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        username: result.user.username,
      },
      createdOnDate: result.tenant.created_on_date,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/tenant/:id
 * Updates tenant name and/or subdomain.
 */
adminTenantRouter.put<{ id: string }, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await db('tenant').where('id', id).first();
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    const { name, subdomain } = req.body;
    const update: Record<string, unknown> = {};

    if (name !== undefined) update.name = name.trim();

    if (subdomain !== undefined) {
      const normalizedSubdomain = subdomain.trim().toLowerCase();
      if (!SUBDOMAIN_REGEX.test(normalizedSubdomain)) {
        res.status(400).json({ message: 'Subdomain must be lowercase alphanumeric with hyphens only' });
        return;
      }
      if (['admin', 'www', 'api', 'app'].includes(normalizedSubdomain)) {
        res.status(400).json({ message: 'This subdomain is reserved' });
        return;
      }
      const existing = await db('tenant').where('subdomain', normalizedSubdomain).whereNot('id', id).first();
      if (existing) {
        res.status(409).json({ message: 'Subdomain is already in use' });
        return;
      }
      update.subdomain = normalizedSubdomain;
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }

    const [updated] = await db('tenant').where('id', id).update(update).returning('*');

    res.json({
      id: updated.id,
      name: updated.name,
      subdomain: updated.subdomain,
      status: updated.status,
      statusReason: updated.status_reason,
      modifiedOnDate: updated.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/tenant/:id/suspend
 * Suspends a tenant with a reason.
 */
adminTenantRouter.post<{ id: string }, MessageResponse>('/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      res.status(400).json({ message: 'Suspension reason is required' });
      return;
    }

    const tenant = await db('tenant').where('id', id).first();
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    if (tenant.status === 'SUSPENDED') {
      res.status(400).json({ message: 'Tenant is already suspended' });
      return;
    }

    const [updated] = await db('tenant').where('id', id).update({
      status: 'SUSPENDED',
      status_reason: reason.trim(),
    }).returning('*');

    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      statusReason: updated.status_reason,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/tenant/:id/activate
 * Activates a suspended or inactive tenant.
 */
adminTenantRouter.post<{ id: string }, MessageResponse>('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await db('tenant').where('id', id).first();
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    if (tenant.status === 'ACTIVE') {
      res.status(400).json({ message: 'Tenant is already active' });
      return;
    }

    if (tenant.status === 'PENDING') {
      res.status(400).json({ message: 'Cannot activate a pending tenant' });
      return;
    }

    const [updated] = await db('tenant').where('id', id).update({
      status: 'ACTIVE',
      status_reason: '',
    }).returning('*');

    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      statusReason: updated.status_reason,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/tenant/:id/users
 * Lists all users for a specific tenant.
 */
adminTenantRouter.get<{ id: string }, MessageResponse>('/:id/users', async (req, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await db('tenant').where('id', id).first();
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    const rows = await db('user')
      .select(
        'user.id', 'user.title', 'user.first_name', 'user.last_name',
        'user.username', 'user.is_active', 'user.is_super_admin',
        'user.auth_provider', 'user.created_on_date',
        'user_contact.email as contact_email', 'user_contact.phone as contact_phone',
      )
      .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
      .where('user.tenant_id', id);

    res.json(rows.map((r: any) => ({
      id: r.id,
      title: r.title || '',
      firstName: r.first_name,
      lastName: r.last_name,
      username: r.username,
      isActive: r.is_active,
      isSuperAdmin: r.is_super_admin,
      authProvider: r.auth_provider,
      email: r.contact_email || r.username,
      phone: r.contact_phone || '',
      createdOnDate: r.created_on_date,
    })));
  } catch (err) {
    next(err);
  }
});

export default adminTenantRouter;
