import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

import api from './api';
import MessageResponse from './interfaces/MessageResponse';

require('dotenv').config();
const port = process.env.PORT || 5000;

function startServer() {

  const app = express();

  app.use(morgan('dev'));
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  /** Serves the API */
  app.use('/api/v1', api);

  /** Serves static uploaded content */
  app.use('/content', cors(), express.static(path.join(__dirname, 'content')));

  /** Serves the client application & assets */
  app.get<{}, MessageResponse>('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Starts Server
  app.listen(port, () => {
    console.log(`Listening: http://localhost:${port}`);
  });

}

export default startServer;