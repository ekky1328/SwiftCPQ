import { pgTable, serial, varchar, text, boolean, numeric } from "drizzle-orm/pg-core";
import { dateDefaults } from "../index";
import { tenant } from "./tenant";

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
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
    tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
    userId: numeric('user_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),

    ...dateDefaults
});

export const userLocation = pgTable('user_location', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  userId: numeric('user_id').notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),

  ...dateDefaults
});

export const role = pgTable('roles', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull().default(''),
  
  ...dateDefaults
});

export const permission = pgTable('permissions', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),

  ...dateDefaults
});

export const roleUser = pgTable('role_user', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  roleId: numeric('role_id').references(() => role.id).notNull(),
  userId: numeric('user_id').references(() => user.id).notNull(),

  ...dateDefaults
});

export const rolePermission = pgTable('role_permission', {
  id: serial('id').primaryKey(),
  tenantId: numeric('tenant_id').references(() => tenant.id).notNull(),
  roleId: numeric('role_id').references(() => role.id).notNull(),
  permissionId: numeric('permission_id').references(() => permission.id).notNull(),

  ...dateDefaults
});

