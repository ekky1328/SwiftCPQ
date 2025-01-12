import { pgTable, varchar, text, integer, boolean, date, uuid, timestamp } from 'drizzle-orm/pg-core';

import { itemType, proposalStatus, sectionRecurrance, sectionType } from './enums';
import { user } from './user';
import { tenant } from './tenant';
import { customer } from './customer';
import { sql } from 'drizzle-orm';

export const proposal = pgTable('proposal', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  version: integer('version').notNull(),
  identifier: varchar('identifier', { length: 5 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: proposalStatus().default("DRAFT").notNull(),
  
  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  userId: uuid('user_id').references(() => user.id),
  customerId: uuid('customer_id').references(() => customer.id),

    createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
    modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
});

export const section = pgTable('proposal_section', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 255 }).notNull(),
  type: sectionType().notNull(),
  order: integer('order').notNull(),
  recurrance: sectionRecurrance(),
  description: text('description').notNull().default(""),
  isOptional: boolean('is_optional').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isReference: boolean('is_reference').notNull().default(false),
  blockRemoval: boolean('block_removal').notNull().default(false),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  proposalId: uuid('proposal_id').references(() => proposal.id),

  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
}, (t) => [
  {
    name: 'proposal_section_order_unique',
    unique: [t.proposalId, t.order]
  }
]);

export const item = pgTable('proposal_section_item', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  order: integer('order').notNull(),
  sku: varchar('sku', { length: 256 }),
  title: varchar('title', { length: 255 }).notNull().default(""),
  description: text('description').notNull(),
  qty: integer('qty').notNull().default(0),
  cost: integer("cost").notNull(),
  price: integer("price").notNull(),
  margin: integer("margin").notNull(),
  subtotal: integer("subtotal").notNull(),
  type: itemType().notNull().default("PRODUCT"),
  isOptional: boolean('is_optional').default(false),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  sectionId: uuid('section_id').references(() => section.id),
  
  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
}, (t) => [
  {
    name: 'section_item_order_unique',
    unique: [t.sectionId, t.order]
  }
]);

export const milestone = pgTable('proposal_section_milestone', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 255 }),
  description: text('description').notNull().default(""),
  order: integer('order').notNull(),
  dueDate: date('due_date'),
  amount: integer("amount").notNull(),

  tenantId: uuid('tenant_id').references(() => tenant.id).notNull(),
  sectionId: uuid('section_id').references(() => section.id),
  
  createdOnDate: timestamp('created_on_date').notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date').notNull().defaultNow().$onUpdate(() => new Date())
}, (t) => [
  {
    name: 'section_milestone_order_unique',
    unique: [t.sectionId, t.order]
  }
]);
