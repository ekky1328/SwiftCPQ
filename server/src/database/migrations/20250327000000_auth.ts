import * as fs from 'fs';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250327000000_auth_up.sql`, 'utf-8'));
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(fs.readFileSync(`${__dirname}/20250327000000_auth_down.sql`, 'utf-8'));
}
