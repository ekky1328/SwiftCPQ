import { pgTable, serial, varchar, text, numeric, boolean, jsonb, timestamp, pgEnum, date } from 'drizzle-orm/pg-core';
import { itemType, proposalStatus, sectionRecurrance, sectionType } from './enums';

const dateDefaults = {
  createdOnDate: timestamp('created_on_date', { mode: 'date', precision: 3 }).notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date', { mode: 'date', precision: 3 }).notNull().defaultNow().$onUpdate(() => new Date()),
}

export const proposal = pgTable('proposal', {
  id: serial('id').primaryKey(),
  version: numeric('version').notNull(),
  identifier: varchar('identifier', { length: 5 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: proposalStatus().default("DRAFT").notNull(),

  author: jsonb('author'),
  customer: jsonb('customer'),

  ...dateDefaults
});


export const section = pgTable('section', {
  id: serial('id').primaryKey(),
  proposalId: numeric('proposal_id').references(() => proposal.id).notNull(),
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

export const item = pgTable('item', {
  id: serial('id').primaryKey(),
  sectionId: numeric('section_id').references(() => section.id),
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

export const milestone = pgTable('milestone', {
  id: serial('id').primaryKey(),
  sectionId: numeric('section_id').references(() => section.id),
  title: varchar('title', { length: 255 }),
  description: text('description').notNull().default(""),
  order: numeric('order').notNull().unique(),
  dueDate: date('due_date'),
  amount: numeric("amount", { scale: 100, precision: 2 }).notNull(),
  
  ...dateDefaults
});
