import express, { Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import ejs from 'ejs';
import fs from 'fs';

import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import { getProposalData } from './controller/getProposalData';

require('dotenv').config();

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('/api/v1', api);

app.get<{ templateId: string, proposalId: string }, MessageResponse>('/pdf/:templateId/:proposalId', async (req, res) => {
  const { templateId } = req.params;
  const templatePath = path.join(app.get('views'), templateId, 'index.ejs');
  
  if (fs.existsSync(templatePath)) {
    const proposalData = await getProposalData(req.params.proposalId);
    res.render(`${templateId}/index`, { proposal: proposalData });
  } 
  
  else {
    res.status(404).send({ message: 'Template not found' });
  }
});

app.get<{}, MessageResponse>('/', (req, res) => {
  res.render('index', { message: 'Hello, EJS!' });
});

export default app;