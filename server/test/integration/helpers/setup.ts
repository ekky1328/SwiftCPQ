import knex from 'knex';

/**
 * Jest globalSetup — runs once before all integration tests in a separate process.
 * Drops and recreates the public schema, then runs all migrations to get a clean state.
 */
export default async function setup(): Promise<void> {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL environment variable is not set');
  }

  const db = knex({
    client: 'pg',
    connection: { connectionString },
    migrations: {
      tableName: 'knex_migrations',
      directory: `${__dirname}/../../../src/database/migrations`,
    },
  });

  try {
    // Drop and recreate the schema for a clean slate
    await db.raw('DROP SCHEMA public CASCADE');
    await db.raw('CREATE SCHEMA public');

    // Run all migrations
    await db.migrate.latest();
  } finally {
    await db.destroy();
  }
}
