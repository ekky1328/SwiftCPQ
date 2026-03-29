interface TenantListItem {
  id: string;
  name: string;
  subdomain: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  statusReason: string;
  userCount: number;
  adminUser: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  } | null;
  createdOnDate: string;
  modifiedOnDate: string;
}

interface TenantDetail extends TenantListItem {
  settings: {
    prefix: string;
    suffix: string;
    logo: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    selectedTemplate: string;
    staleInventoryDays: number;
  } | null;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  contactInformation: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
    };
  };
  proposalSettings: {
    expiry: number;
    tax: boolean;
    taxRate: number;
  } | null;
}

interface TenantUser {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  authProvider: string;
  email: string;
  phone: string;
  createdOnDate: string;
}
