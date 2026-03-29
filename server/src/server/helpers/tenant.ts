import { Request, Response, NextFunction } from 'express';

import db from '../../database/db';

/**
 * Middleware that resolves the tenant from the request context.
 *
 * - Single-tenant mode (no MULTI_TENANT env): resolves the single active tenant.
 * - Multi-tenant mode: extracts the subdomain from the Host header and looks up the tenant.
 *   Root domain or 'admin' subdomain results in null tenantId (aka super admin routes).
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    if (!process.env.MULTI_TENANT) {
      const tenant = await db('tenant').where('status', 'ACTIVE').first();
      if (tenant) req.tenantId = tenant.id;
      return next();
    }

    const host = req.hostname;
    const baseDomain = process.env.BASE_DOMAIN;

    if (!baseDomain) {
      req.tenantId = null;
      return next();
    }

    if (host === baseDomain || !host.endsWith(`.${baseDomain}`)) {
      req.tenantId = null;
      return next();
    }

    const subdomain = host.slice(0, host.length - baseDomain.length - 1);
    if (subdomain === 'admin' || subdomain === 'www') {
      req.tenantId = null;
      return next();
    }

    const tenant = await db('tenant')
      .where('subdomain', subdomain)
      .where('status', 'ACTIVE')
      .first();

    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    req.tenantId = tenant.id;
    next();
  }
  
  catch (err) {
    next(err);
  }
}
