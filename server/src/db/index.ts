import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { timestamp } from 'drizzle-orm/pg-core';

export const db = drizzle(process.env.DATABASE_URL!);

export const dateDefaults = {
  createdOnDate: timestamp('created_on_date', { mode: 'date', precision: 3 }).notNull().defaultNow(),
  modifiedOnDate: timestamp('modified_on_date', { mode: 'date', precision: 3 }).notNull().defaultNow().$onUpdate(() => new Date()),
}