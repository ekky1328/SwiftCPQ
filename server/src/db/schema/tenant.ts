import { pgTable, serial, varchar, boolean, numeric, text, integer } from 'drizzle-orm/pg-core';

import { dateDefaults } from '../index';
import { tenantStatus } from './enums';
import { user } from './user';

export const tenant = pgTable('tenant', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    domain: varchar('subdomain', { length: 255 }).unique(),
    adminUserId: integer('admin_user_id').notNull(),
    status: tenantStatus('status').default("ACTIVE").notNull(),
    statusReason: text('status_reason').default('').notNull(),

    ...dateDefaults
});


export const settings = pgTable('tenant_settings', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    prefix: varchar('prefix', { length: 50 }).notNull().default("S-CPQ"),
    suffix: varchar('suffix', { length: 50 }).notNull().default(""),
    logo: varchar('logo', { length: 255 }).notNull().default("default.svg"),
    currency: varchar('currency', { length: 10 }).notNull().default("USD"),
    timezone: varchar('timezone', { length: 100 }).notNull().default("UTC"),
    dateFormat: varchar('date_format', { length: 20 }).notNull().default("YYYY-MM-DD"),
    contactInformation: integer('contact_information').references(() => tenantContactInformation.id).notNull(),
    proposalSettings: integer('proposal_settings').references(() => tenantProposalSettings.id).notNull(),
    theme: integer('proposal_settings_default').references(() => tenantTheme.id).notNull()
});


export const tenantContactInformation = pgTable('tenant_contact_information', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    email: varchar('email').notNull(),
    phone: varchar('phone').notNull(),
    addressId: integer('address').references(() => tenantAddressInformation.id).notNull(),

    ...dateDefaults,
});


export const tenantAddressInformation = pgTable('tenant_address_information', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    zipCode: varchar('zip_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
  
    ...dateDefaults
});
  

export const tenantProposalSettings = pgTable('tenant_proposal_setting', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    expiry: numeric('expiry').notNull().default("14"),
    tax: boolean('tax').notNull().default(true),
    taxRate: numeric('tax_rate').notNull().default("10"),

    ...dateDefaults,
});


export const tenantTheme = pgTable('tenant_theme', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    primary: varchar('primary').notNull().default("#ff822d"),
    secondary: varchar('secondary').notNull().default("#2D7FFF"),
    accent: varchar('accent').notNull().default("#CC681F"),

    ...dateDefaults,
});
  
export const role = pgTable('tenant_role', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    
    ...dateDefaults
});

export const permission = pgTable('tenant_permission', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    isActive: boolean('is_active').notNull().default(true),

    ...dateDefaults
});

export const roleUser = pgTable('tenant_role_user', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    roleId: integer('role_id').references(() => role.id).notNull(),
    userId: integer('user_id').references(() => user.id).notNull(),

    ...dateDefaults
});

export const rolePermission = pgTable('tenant_role_permission', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    roleId: integer('role_id').references(() => role.id).notNull(),
    permissionId: integer('permission_id').references(() => permission.id).notNull(),

    ...dateDefaults
});
  