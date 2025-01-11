import { pgTable, serial, varchar, integer, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { dateDefaults } from '..';
import { tenant } from './tenant';

export const customer = pgTable('customer', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  primaryContactId: integer('primary_contact_id').notNull(),
  primaryLocationId: integer('primary_location_id').notNull(),
  ...dateDefaults
});

export const contact = pgTable('contact', {
    id: serial('id').primaryKey(),
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    customerId: integer('customer_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    role: varchar('role', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    ...dateDefaults
});

export const location = pgTable('location', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  customerId: integer('customer_id').notNull(),
  locationId: integer('location_id'),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  ...dateDefaults
});
