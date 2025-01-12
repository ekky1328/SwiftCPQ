import { sql } from 'drizzle-orm';
import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';

import { tenant } from './tenant';

export const customer = pgTable('customer', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  
  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  primaryContactId: uuid('primary_customer_contact_id'),
  primaryLocationId: uuid('primary_customer_location_id'),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const customerContact = pgTable('customer_contact', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    title: varchar('role', { length: 255 }).notNull(),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
    customerId: uuid('customer_id').references(() => customer.id),
    locationId: uuid('location_id').references(() => customerLocation.id),
    
    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const customerLocation = pgTable('customer_location', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  customerId: uuid('customer_id').references(() => customer.id),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});
