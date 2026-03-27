import * as fs from 'fs';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250327000001_catalogue_up.sql`, 'utf-8'));
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250327000001_catalogue_down.sql`, 'utf-8'));
}
