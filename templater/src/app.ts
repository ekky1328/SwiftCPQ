import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import { getProposalData } from './controller/getProposalData';
import { generatePdf } from './pdf/generator';

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

/**
 * GET /download/:templateId/:proposalId
 * Renders the proposal template via headless browser and returns a PDF binary.
 * Only accessible with the internal service token.
 */
app.get<{ templateId: string, proposalId: string }, MessageResponse>('/download/:templateId/:proposalId', async (req, res) => {
  const serviceToken = req.headers['x-service-token'];
  if (!serviceToken || serviceToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { templateId, proposalId } = req.params;
  const templatePath = path.join(app.get('views'), templateId, 'index.ejs');

  if (!fs.existsSync(templatePath)) {
    res.status(404).json({ message: 'Template not found' });
    return;
  }

  try {
    const port = process.env.PORT || 5005;
    const pdf = await generatePdf(templateId, proposalId, port);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal-${proposalId}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

app.get<{}, MessageResponse>('/', (req, res) => {
  res.render('index', { message: 'Hello, EJS!' });
});

export default app;