import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import { resolveTenant } from './helpers/tenant';

require('dotenv').config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const baseDomain = process.env.BASE_DOMAIN;

function getCorsOrigin(): string | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  if (process.env.MULTI_TENANT && baseDomain) {
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
          return callback(null, true);
        }
      } catch { /* invalid origin */ }
      // Also allow the explicit CORS_ORIGIN for development
      if (origin === corsOrigin) return callback(null, true);
      callback(null, false);
    };
  }
  return corsOrigin;
}

// Middlewares
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(resolveTenant);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', api);

/**
 * Serves Client Uploaded Content
 */
app.use('/content', cors(), express.static(path.join(__dirname, 'content')));


/**
 * Serves the Vue App
 */
app.get<{}, MessageResponse>('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
