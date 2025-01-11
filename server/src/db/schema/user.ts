import { pgTable, serial, varchar, text, boolean, integer } from "drizzle-orm/pg-core";
import { dateDefaults } from "../index";
import { tenant } from "./tenant";

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  description: text('description').notNull(),
  isActive: boolean().notNull().default(true),
  isSuperAdmin: boolean().notNull().default(false),

  ...dateDefaults
});

export const userContact = pgTable('user_contact', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
    userId: integer('user_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),

    ...dateDefaults
});

export const userLocation = pgTable('user_location', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  userId: integer('user_id').notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),

  ...dateDefaults
});
