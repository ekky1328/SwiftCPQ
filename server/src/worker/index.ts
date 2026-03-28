import db from '../database/db';
import { runIngestion } from './ingestion/pipeline';
import { runStaleCleanup } from './ingestion/stale-cleanup';

const POLL_INTERVAL = Number(process.env.WORKER_POLL_INTERVAL) || 5_000; // default: 5 seconds
const CLEANUP_INTERVAL = Number(process.env.WORKER_CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000; // default: daily

async function claimNextJob() {
  return db.transaction(async (trx) => {
    const job = await trx('ingestion_job')
      .where('status', 'PENDING')
      .orderBy('created_on_date', 'asc')
      .forUpdate()
      .skipLocked()
      .first();

    if (!job) return null;

    await trx('ingestion_job')
      .where('id', job.id)
      .update({ status: 'PROCESSING', started_at: db.fn.now() });

    return job;
  });
}

async function processJobs() {
  let job = await claimNextJob();

  while (job) {
    console.log(`[worker] processing ingestion job ${job.id} for vendor ${job.vendor_id}`);

    try {
      const csvBuffer = Buffer.isBuffer(job.csv_data) ? job.csv_data : Buffer.from(job.csv_data);
      const result = await runIngestion(job.tenant_id, job.vendor_id, csvBuffer);

      await db('ingestion_job')
        .where('id', job.id)
        .update({
          status: 'COMPLETED',
          result: JSON.stringify(result),
          completed_at: db.fn.now(),
        });

      console.log(`[worker] job ${job.id} completed: inserted=${result.inserted} updated=${result.updated} created=${result.created} errors=${result.errors.length}`);
    } catch (err: any) {
      console.error(`[worker] job ${job.id} failed:`, err.message);

      await db('ingestion_job')
        .where('id', job.id)
        .update({
          status: 'FAILED',
          error: err.message,
          completed_at: db.fn.now(),
        });
    }

    job = await claimNextJob();
  }
}

export default function startWorker() {
  console.log('[worker] started');

  setInterval(() => {
    processJobs().catch((err) => {
      console.error('[worker] job processing error:', err);
    });
  }, POLL_INTERVAL);

  runStaleCleanup().catch((err) => {
    console.error('[worker] stale cleanup error on startup:', err);
  });

  setInterval(() => {
    console.log('[worker] running stale inventory cleanup...');
    runStaleCleanup().catch((err) => {
      console.error('[worker] stale cleanup error:', err);
    });
  }, CLEANUP_INTERVAL);
}
