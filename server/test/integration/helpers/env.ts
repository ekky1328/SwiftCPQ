/**
 * Sets DATABASE_URL to the test database before any module is loaded.
 * This runs in each test worker process via jest setupFiles.
 */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
