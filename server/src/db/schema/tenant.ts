import { pgTable, serial, varchar, boolean, text, integer, uuid, timestamp} from 'drizzle-orm/pg-core';

import { tenantStatus } from './enums';
import { user } from './user';
import { sql } from 'drizzle-orm';

export const tenant = pgTable('tenant', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    domain: varchar('subdomain', { length: 255 }).unique(),
    status: tenantStatus('status').default("PENDING").notNull(),
    statusReason: text('status_reason').default('').notNull(),
    
    adminUserId: uuid('admin_user_id'),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});


export const settings = pgTable('tenant_settings', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    prefix: varchar('prefix', { length: 50 }).notNull().default("S-CPQ"),
    suffix: varchar('suffix', { length: 50 }).notNull().default(""),
    logo: varchar('logo', { length: 255 }).notNull().default("default.svg"),
    currency: varchar('currency', { length: 10 }).notNull().default("USD"),
    timezone: varchar('timezone', { length: 100 }).notNull().default("UTC"),
    dateFormat: varchar('date_format', { length: 20 }).notNull().default("YYYY-MM-DD"),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
    contactInformation: uuid('contact_information').references(() => tenantContactInformation.id),
    proposalSettings: uuid('proposal_settings').references(() => tenantProposalSettings.id),
    theme: uuid('proposal_settings_default').references(() => tenantTheme.id),
    
    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});


export const tenantContactInformation = pgTable('tenant_contact_information', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: varchar('email').notNull(),
    phone: varchar('phone').notNull(),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
    addressId: uuid('address').references(() => tenantAddressInformation.id),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});


export const tenantAddressInformation = pgTable('tenant_address_information', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    zipCode: varchar('zip_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),

    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
    
    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});
  

export const tenantProposalSettings = pgTable('tenant_proposal_setting', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    expiry: integer('expiry').notNull().default(14),
    tax: boolean('tax').notNull().default(true),
    taxRate: integer('tax_rate').notNull().default(10),

    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});


export const tenantTheme = pgTable('tenant_theme', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    primary: varchar('primary').notNull().default("#ff822d"),
    secondary: varchar('secondary').notNull().default("#2D7FFF"),
    accent: varchar('accent').notNull().default("#CC681F"),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});
  
export const role = pgTable('tenant_role', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const permission = pgTable('tenant_permission', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    isActive: boolean('is_active').notNull().default(true),

    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const roleUser = pgTable('tenant_role_user', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    
    roleId: uuid('role_id').references(() => role.id).notNull(),
    userId: uuid('user_id').references(() => user.id).notNull(),
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const rolePermission = pgTable('tenant_role_permission', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    
    roleId: uuid('role_id').references(() => role.id).notNull(),
    permissionId: uuid('permission_id').references(() => permission.id).notNull(),
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});
  