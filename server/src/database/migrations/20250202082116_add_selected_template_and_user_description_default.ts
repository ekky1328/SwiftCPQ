import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add selected_template column to tenant_settings (from CoreSettings type)
  await knex.schema.alterTable('tenant_settings', (table) => {
    table.string('selected_template', 255).notNullable().defaultTo('default');
  });

  // Add default value to user.description so inserts without description don't fail
  await knex.raw("ALTER TABLE \"user\" ALTER COLUMN description SET DEFAULT ''");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenant_settings', (table) => {
    table.dropColumn('selected_template');
  });

  await knex.raw('ALTER TABLE "user" ALTER COLUMN description DROP DEFAULT');
}
