import express from 'express';
import fs from 'fs';

import MessageResponse from '../interfaces/MessageResponse';

const systemRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/system/core-settings
 * - Gets the system core settings
 */
systemRouter.get<{}, MessageResponse>('/system/core-settings', (req, res) => {

  let raw_data = fs.readFileSync(`${__dirname}/../data/system/core-settings.json`, 'utf-8');
  let json_data = JSON.parse(raw_data);

  res.json(json_data);
});

export default systemRouter;
