import { pgTable, serial, varchar, text, integer, boolean, date, unique } from 'drizzle-orm/pg-core';

import { dateDefaults } from "../index";
import { itemType, proposalStatus, sectionRecurrance, sectionType } from './enums';
import { user } from './user';
import { tenant } from './tenant';
import { customer } from './customer';

export const proposal = pgTable('proposal', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  version: integer('version').notNull(),
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
  order: integer('order').notNull(),
  recurrance: sectionRecurrance(),
  description: text('description').notNull().default(""),
  isOptional: boolean('is_optional').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isReference: boolean('is_reference').notNull().default(false),
  blockRemoval: boolean('block_removal').notNull().default(false),

  ...dateDefaults
}, (t) => [{
  unq: unique().on(t.proposalId, t.order)
}]);

export const item = pgTable('proposal_section_item', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  sectionId: integer('section_id').references(() => section.id).notNull(),
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
  
  ...dateDefaults
}, (t) => [{
  unq: unique().on(t.sectionId, t.order)
}]);

export const milestone = pgTable('proposal_section_milestone', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenant.id).notNull(),
  sectionId: integer('section_id').references(() => section.id),
  title: varchar('title', { length: 255 }),
  description: text('description').notNull().default(""),
  order: integer('order').notNull(),
  dueDate: date('due_date'),
  amount: integer("amount").notNull(),
  
  ...dateDefaults
}, (t) => [{
  unq: unique().on(t.sectionId, t.order)
}]);
