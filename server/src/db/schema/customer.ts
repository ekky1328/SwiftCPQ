import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { dateDefaults } from '..';
import { tenant } from './tenant';

export const customer = pgTable('customer', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),

  primaryContactId: integer('primary_customer_contact_id'),
  primaryLocationId: integer('primary_customer_location_id'),

  ...dateDefaults
});

export const customerContact = pgTable('customer_contact', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    title: varchar('role', { length: 255 }).notNull(),
    
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    customerId: integer('customer_id').references(() => customer.id).notNull(),
    locationId: integer('location_id').references(() => customerLocation.id),
    
    ...dateDefaults
});

export const customerLocation = pgTable('customer_location', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  customerId: integer('customer_id').references(() => customer.id).notNull().notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),

  ...dateDefaults
});
