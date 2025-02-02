require('dotenv').config();

import startServer from './server';
import startWorker from './worker';

const mode = process.env.MODE || 1;

if (mode === 1) {
  startServer();
}

else {
  startWorker();
}