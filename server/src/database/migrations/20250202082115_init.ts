import * as fs from 'fs';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250202082115_init_up.sql`, 'utf-8'));
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250202082115_init_down.sql`, 'utf-8'));
}