import { pgTable, serial, varchar, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

import { tenant } from "./tenant";
import { sql } from "drizzle-orm";

export const user = pgTable('user', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  description: text('description').notNull(),
  isActive: boolean().notNull().default(true),
  isSuperAdmin: boolean().notNull().default(false),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),

  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userContact = pgTable('user_contact', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    
    tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
    userId: uuid('user_id').references(() => user.id),

  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userLocation = pgTable('user_location', {
  id: uuid('uuid').primaryKey().default(sql`gen_random_uuid()`),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  userId: uuid('user_id').references(() => user.id),

  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date()),
});
