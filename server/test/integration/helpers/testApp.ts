/**
 * Returns the Express app for integration testing.
 * DATABASE_URL is already set to TEST_DATABASE_URL via env.ts setupFiles.
 */
import app from '../../../src/server/app';

export default app;
