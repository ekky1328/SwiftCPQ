import { pgTable, serial, varchar, integer, boolean, numeric, text } from 'drizzle-orm/pg-core';

import { dateDefaults } from '../index';
import { tenantStatus } from './enums';

export const tenant = pgTable('tenant', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    domain: varchar('subdomain', { length: 255 }).unique(),
    adminUserId: numeric('admin_user_id').notNull(),
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
    contactInformationDefault: numeric('contact_information_default').references(() => tenantContactInformationDefault.id).notNull(),
    proposalSettingsDefault: numeric('proposal_settings_default').references(() => tenantProposalDefault.id).notNull(),
    theme: numeric('proposal_settings_default').references(() => tenantProposalDefault.id).notNull()
});


export const tenantContactInformationDefault = pgTable('tenant_contact_information_default', {
    id: serial('id').primaryKey(),
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    email: varchar('email').notNull(),
    phone: varchar('phone').notNull(),
    addressId: numeric('address').references(() => tenantAddressInformationDefault.id).notNull(),

    ...dateDefaults,
});


export const tenantAddressInformationDefault = pgTable('tenant_address_information_default', {
    id: serial('id').primaryKey(),
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    zipCode: varchar('zip_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
  
    ...dateDefaults
});
  

export const tenantProposalDefault = pgTable('tenant_proposal_default', {
    id: serial('id').primaryKey(),
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    expiry: numeric('expiry').notNull().default("14"),
    tax: boolean('tax').notNull().default(true),
    taxRate: numeric('tax_rate').notNull().default("10"),

    ...dateDefaults,
});


export const tenantThemeDefault = pgTable('tenant_theme_default', {
    id: serial('id').primaryKey(),
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    primary: varchar('primary').notNull().default("#ff822d"),
    secondary: varchar('secondary').notNull().default("#2D7FFF"),
    accent: varchar('accent').notNull().default("#CC681F"),

    ...dateDefaults,
});
  