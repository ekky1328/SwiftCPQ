import express from 'express';
import fs from 'fs';

import MessageResponse from '../interfaces/MessageResponse';

const router = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id
 * - Gets the proposal JSON based on the :id
 */
router.get<{}, MessageResponse>('/proposal/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let raw_data = fs.readFileSync(`${__dirname}/../data/proposals/${id}.json`, 'utf-8');
  let json_data = JSON.parse(raw_data);

  res.json(json_data);
});

/**
 * Method: POST
 * Endpoint: /api/v1/proposal/:id
 * - Saves the proposal JSON based on the :id
 */
router.post<{}, MessageResponse>('/proposal/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let { payload } = req.body as { payload: any };
  fs.writeFileSync(`${__dirname}/../data/proposals/${id}.json`, JSON.stringify(payload), 'utf-8');
  
  res.json(payload);
});

export default router;
