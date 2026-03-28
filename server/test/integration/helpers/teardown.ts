/**
 * Jest globalTeardown — runs once after all integration tests.
 * The test DB connection is handled per-worker via the shared `db` singleton;
 * this teardown is intentionally minimal since each worker closes its own connection.
 */
export default async function teardown(): Promise<void> {
  // Nothing to do globally — knex connections are closed per-worker
  // when the test process exits naturally.
}
