import type { Knex } from "knex";

const databaseUrl = process.env.DATABASE_URL;

const config: Knex.Config = {
  client: "postgresql",
  connection: databaseUrl,
  useNullAsDefault: true,
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: "knex_migrations",
    directory: "./src/database/migrations"
  },
  seeds: {
    directory: "./src/database/seeds"
  }
};

export { config };
