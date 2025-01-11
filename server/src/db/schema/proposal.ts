import { pgTable, serial, varchar, text, numeric, boolean, date, integer } from 'drizzle-orm/pg-core';
import { itemType, proposalStatus, sectionRecurrance, sectionType } from './enums';
import { dateDefaults } from "../index";
import { user } from './user';
import { tenant } from './tenant';
import { customer } from './customer';

export const proposal = pgTable('proposal', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  version: numeric('version').notNull(),
  identifier: varchar('identifier', { length: 5 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: proposalStatus().default("DRAFT").notNull(),

  userId: integer('user_id').references(() => user.id).notNull(),
  customerId: integer('customer_id').references(() => customer.id).notNull(),

  ...dateDefaults
});

export const section = pgTable('proposal_section', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  proposalId: integer('proposal_id').references(() => proposal.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: sectionType().notNull(),
  order: numeric('order').notNull().unique(),
  recurrance: sectionRecurrance(),
  description: text('description').notNull().default(""),
  isOptional: boolean('is_optional').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isReference: boolean('is_reference').notNull().default(false),
  blockRemoval: boolean('block_removal').notNull().default(false),

  ...dateDefaults
});

export const item = pgTable('proposal_section_item', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  sectionId: integer('section_id').references(() => section.id),
  title: varchar('title', { length: 255 }).notNull().default(""),
  description: text('description').notNull(),
  order: numeric('order').notNull().unique(),
  qty: numeric('qty').notNull().default("0"),
  cost: numeric("cost", { scale: 100, precision: 2 }).notNull(),
  price: numeric("price", { scale: 100, precision: 2 }).notNull(),
  margin: numeric("margin", { scale: 100, precision: 2 }).notNull(),
  subtotal: numeric("subtotal", { scale: 100, precision: 2 }).notNull(),
  sku: varchar('sku', { length: 256 }).notNull(),
  type: itemType().notNull().default("PRODUCT"),
  isOptional: boolean('is_optional').default(false),
  
  ...dateDefaults
});

export const milestone = pgTable('proposal_section_milestone', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  sectionId: integer('section_id').references(() => section.id),
  title: varchar('title', { length: 255 }),
  description: text('description').notNull().default(""),
  order: numeric('order').notNull().unique(),
  dueDate: date('due_date'),
  amount: numeric("amount", { scale: 100, precision: 2 }).notNull(),
  
  ...dateDefaults
});
