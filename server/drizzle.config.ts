import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseString = process.env.DATABASE_URL;

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseString,
  },
});