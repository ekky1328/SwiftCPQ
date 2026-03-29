import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import { resolveTenant } from './helpers/tenant';
import { getCorsOrigin } from './helpers/getCorsOrigin';

require('dotenv').config();

const app = express();

app.use(morgan('dev'));
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' }}));
app.use(cors({ origin: getCorsOrigin(), credentials: true}));
app.use(cookieParser());
app.use(express.json());
app.use(resolveTenant);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', api);
app.use('/content', cors(), express.static(path.join(__dirname, 'content')));

app.get<{}, MessageResponse>('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
