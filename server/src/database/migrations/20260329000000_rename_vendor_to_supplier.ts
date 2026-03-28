import * as fs from 'fs';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20260329000000_rename_vendor_to_supplier_up.sql`, 'utf-8'));
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20260329000000_rename_vendor_to_supplier_down.sql`, 'utf-8'));
}
