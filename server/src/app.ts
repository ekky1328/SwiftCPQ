import express, { Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

import * as middlewares from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';

require('dotenv').config();

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', api);

// Serve the index.html file at the root URL
app.get<{}, MessageResponse>('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
