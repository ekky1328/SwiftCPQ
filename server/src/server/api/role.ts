import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const roleRouter = express.Router();


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
// ROLE ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/role/
 * - Gets a list of roles
 */
roleRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();

    const roles = await db('tenant_role')
      .where('tenant_id', tenantId)
      .orderBy('name');

    res.json(roles.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdOnDate: r.created_on_date,
      modifiedOnDate: r.modified_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/role/:id
 * - Gets a role by ID with its permissions and assigned users
 */
roleRouter.get<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const role = await db('tenant_role').where('id', id).first();
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    // Get permissions assigned to this role
    const permissionRows = await db('tenant_role_permission')
      .select(
        'tenant_role_permission.id as assignment_id',
        'tenant_permission.id',
        'tenant_permission.name',
        'tenant_permission.description',
        'tenant_permission.is_active',
      )
      .leftJoin('tenant_permission', 'tenant_role_permission.permission_id', 'tenant_permission.id')
      .where('tenant_role_permission.role_id', id);

    // Get users assigned to this role
    const userRows = await db('tenant_role_user')
      .select(
        'tenant_role_user.id as assignment_id',
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.username',
      )
      .leftJoin('user', 'tenant_role_user.user_id', 'user.id')
      .where('tenant_role_user.role_id', id);

    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissionRows.map((p: Record<string, unknown>) => ({
        assignmentId: p.assignment_id,
        id: p.id,
        name: p.name,
        description: p.description,
        isActive: p.is_active,
      })),
      users: userRows.map((u: Record<string, unknown>) => ({
        assignmentId: u.assignment_id,
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        username: u.username,
      })),
      createdOnDate: role.created_on_date,
      modifiedOnDate: role.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/role/
 * - Creates a new role
 */
roleRouter.post<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Role name is required' });
      return;
    }

    const [{ id: roleId }] = await db('tenant_role').insert({
      tenant_id: tenantId,
      name,
      description: description || '',
    }).returning('id');

    const role = await db('tenant_role').where('id', roleId).first();
    res.status(201).json({
      id: role.id,
      name: role.name,
      description: role.description,
      createdOnDate: role.created_on_date,
      modifiedOnDate: role.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/role/:id
 * - Updates a role
 */
roleRouter.put<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description } = req.body;

    const existing = await db('tenant_role').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await db('tenant_role').where('id', id).update(updateData);
    const role = await db('tenant_role').where('id', id).first();

    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      createdOnDate: role.created_on_date,
      modifiedOnDate: role.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/role/:id
 * - Deletes a role
 */
roleRouter.delete<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await db('tenant_role').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    await db('tenant_role').where('id', id).del();
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/role/:id/user
 * - Assigns a user to a role
 */
roleRouter.post<{}, MessageResponse>('/:id/user', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = req.params as { id: string };
    const { userId } = req.body;

    const role = await db('tenant_role').where('id', id).first();
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const [{ id: assignmentId }] = await db('tenant_role_user').insert({
      tenant_id: tenantId,
      role_id: id,
      user_id: userId,
    }).returning('id');

    res.status(201).json({
      id: assignmentId,
      roleId: id,
      userId,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/role/:id/user/:assignmentId
 * - Removes a user from a role
 */
roleRouter.delete<{}, MessageResponse>('/:id/user/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params as { id: string; assignmentId: string };

    const existing = await db('tenant_role_user').where('id', assignmentId).first();
    if (!existing) {
      res.status(404).json({ message: 'Role assignment not found' });
      return;
    }

    await db('tenant_role_user').where('id', assignmentId).del();
    res.json({ message: 'User removed from role successfully' });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/role/:id/permission
 * - Assigns a permission to a role
 */
roleRouter.post<{}, MessageResponse>('/:id/permission', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = req.params as { id: string };
    const { permissionId } = req.body;

    const role = await db('tenant_role').where('id', id).first();
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    if (!permissionId) {
      res.status(400).json({ message: 'permissionId is required' });
      return;
    }

    const [{ id: assignmentId }] = await db('tenant_role_permission').insert({
      tenant_id: tenantId,
      role_id: id,
      permission_id: permissionId,
    }).returning('id');

    res.status(201).json({
      id: assignmentId,
      roleId: id,
      permissionId,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/role/:id/permission/:assignmentId
 * - Removes a permission from a role
 */
roleRouter.delete<{}, MessageResponse>('/:id/permission/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params as { id: string; assignmentId: string };

    const existing = await db('tenant_role_permission').where('id', assignmentId).first();
    if (!existing) {
      res.status(404).json({ message: 'Permission assignment not found' });
      return;
    }

    await db('tenant_role_permission').where('id', assignmentId).del();
    res.json({ message: 'Permission removed from role successfully' });
  } catch (err) {
    next(err);
  }
});


// =============================================================================
// PERMISSION ENDPOINTS
// =============================================================================


/**
 * Method: GET
 * Endpoint: /api/v1/role/permission/all
 * - Gets a list of all permissions
 */
roleRouter.get<{}, MessageResponse>('/permission/all', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();

    const permissions = await db('tenant_permission')
      .where('tenant_id', tenantId)
      .orderBy('name');

    res.json(permissions.map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.is_active,
      createdOnDate: p.created_on_date,
      modifiedOnDate: p.modified_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/role/permission
 * - Creates a new permission
 */
roleRouter.post<{}, MessageResponse>('/permission', async (req, res, next) => {
  try {
    const tenantId = await getDefaultTenantId();
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Permission name is required' });
      return;
    }

    const [{ id: permissionId }] = await db('tenant_permission').insert({
      tenant_id: tenantId,
      name,
      description: description || '',
    }).returning('id');

    const permission = await db('tenant_permission').where('id', permissionId).first();
    res.status(201).json({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isActive: permission.is_active,
      createdOnDate: permission.created_on_date,
      modifiedOnDate: permission.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/role/permission/:permissionId
 * - Updates a permission
 */
roleRouter.put<{}, MessageResponse>('/permission/:permissionId', async (req, res, next) => {
  try {
    const { permissionId } = req.params as { permissionId: string };
    const { name, description, isActive } = req.body;

    const existing = await db('tenant_permission').where('id', permissionId).first();
    if (!existing) {
      res.status(404).json({ message: 'Permission not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    await db('tenant_permission').where('id', permissionId).update(updateData);
    const permission = await db('tenant_permission').where('id', permissionId).first();

    res.json({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isActive: permission.is_active,
      createdOnDate: permission.created_on_date,
      modifiedOnDate: permission.modified_on_date,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/role/permission/:permissionId
 * - Deletes a permission
 */
roleRouter.delete<{}, MessageResponse>('/permission/:permissionId', async (req, res, next) => {
  try {
    const { permissionId } = req.params as { permissionId: string };

    const existing = await db('tenant_permission').where('id', permissionId).first();
    if (!existing) {
      res.status(404).json({ message: 'Permission not found' });
      return;
    }

    await db('tenant_permission').where('id', permissionId).del();
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    next(err);
  }
});


export default roleRouter;
