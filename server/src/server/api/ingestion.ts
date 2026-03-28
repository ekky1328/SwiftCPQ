import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const ingestionRouter = express.Router();

/**
 * POST /api/v1/ingestion/:vendorId
 * Accepts a raw CSV body and enqueues an ingestion job for the worker to process.
 *
 * Content-Type: text/csv or application/octet-stream
 */
ingestionRouter.post<{ vendorId: string }, MessageResponse>(
  '/:vendorId',
  express.raw({ type: ['text/csv', 'application/octet-stream'], limit: '50mb' }),
  async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

      const { vendorId } = req.params;

      // Verify vendor exists and belongs to tenant
      const vendor = await db('vendor')
        .where('id', vendorId)
        .where('tenant_id', tenantId)
        .where('is_active', true)
        .first();

      if (!vendor) {
        res.status(404).json({ message: 'Vendor not found' });
        return;
      }

      const csvBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

      if (csvBuffer.length === 0) {
        res.status(400).json({ message: 'CSV body is empty' });
        return;
      }

      // Enqueue the job for the worker
      const [job] = await db('ingestion_job').insert({
        tenant_id: tenantId,
        vendor_id: vendorId,
        csv_data: csvBuffer,
      }).returning(['id', 'status', 'created_on_date']);

      res.status(202).json({
        message: 'Ingestion job queued',
        jobId: job.id,
        status: job.status,
        createdOnDate: job.created_on_date,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/ingestion/:jobId/status
 * Returns the current status and result of an ingestion job.
 */
ingestionRouter.get<{ jobId: string }, MessageResponse>(
  '/:jobId/status',
  async (req, res, next) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) { res.status(401).json({ message: 'Unauthorized' }); return; }

      const { jobId } = req.params;

      const job = await db('ingestion_job')
        .select('id', 'vendor_id', 'status', 'result', 'error', 'created_on_date', 'started_at', 'completed_at')
        .where('id', jobId)
        .where('tenant_id', tenantId)
        .first();

      if (!job) {
        res.status(404).json({ message: 'Ingestion job not found' });
        return;
      }

      res.json({
        jobId: job.id,
        vendorId: job.vendor_id,
        status: job.status,
        result: job.result,
        error: job.error,
        createdOnDate: job.created_on_date,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default ingestionRouter;
