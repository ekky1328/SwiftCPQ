import knex from 'knex';

const database = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
  },
});

export default database;