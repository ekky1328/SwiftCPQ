interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  title: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  authProvider: 'LOCAL' | 'ENTRA';
  tenantId: string;
}

interface AuthConfig {
  local: boolean;
  entra: boolean;
}
