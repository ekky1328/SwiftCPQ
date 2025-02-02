import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

const config: Knex.Config = {
  client: "pg",
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

module.exports = config;