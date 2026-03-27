/**
 * Permission name constants.
 * These strings are stored in the `tenant_permission.name` column.
 * Assign them to roles via the /api/v1/role/:id/permission endpoints.
 */
export const PERMISSIONS = {
  ROLES_MANAGE: 'roles.manage',
  USERS_MANAGE: 'users.manage',
  SYSTEM_MANAGE: 'system.manage',
} as const;
