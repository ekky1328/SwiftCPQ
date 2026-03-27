import { NextFunction, Request, Response } from 'express';

import ErrorResponse from './interfaces/ErrorResponse';
import { verifyAccessToken, TokenPayload } from './helpers/jwt';
import db from '../database/db';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Allow internal service-to-service calls via shared token
  const serviceToken = req.headers['x-service-token'];
  if (serviceToken && serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
    next();
    return;
  }

  const token = req.cookies?.access_token;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

/**
 * Middleware factory that checks whether the authenticated user holds the given permission.
 * - Service-token requests (internal) bypass all permission checks.
 * - Super-admin users bypass all permission checks.
 * - Returns 403 if the user's roles do not include the required permission.
 * Must be used AFTER requireAuth so that req.user is populated.
 */
export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const serviceToken = req.headers['x-service-token'];
    if (serviceToken && serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
      next();
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user.isSuperAdmin) {
      next();
      return;
    }

    try {
      const row = await db('tenant_role_user')
        .join('tenant_role_permission', 'tenant_role_user.role_id', 'tenant_role_permission.role_id')
        .join('tenant_permission', 'tenant_role_permission.permission_id', 'tenant_permission.id')
        .where('tenant_role_user.user_id', req.user.userId)
        .where('tenant_permission.name', permissionName)
        .where('tenant_permission.is_active', true)
        .first();

      if (!row) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, next: NextFunction) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
}
