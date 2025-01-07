import express from 'express';
import fs from 'fs';

import MessageResponse from '../interfaces/MessageResponse';

const router = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/proposal/
 * - Gets a list of proposals
 */
router.get<{}, MessageResponse>('/proposal/', (req, res) => {

  let all_proposals = [];
  let proposal_list = fs.readdirSync(`${__dirname}/../data/proposals/`);
  for (let i = 0; i < proposal_list.length; i++) {
    const proposal_filename = proposal_list[i];

    const proposal_raw = fs.readFileSync(`${__dirname}/../data/proposals/${proposal_filename}`, 'utf-8');
    if (!proposal_raw) {
      continue;
    }

    const proposal = JSON.parse(proposal_raw);
    if (!proposal) {
      continue;
    }

    delete proposal.sections;

    all_proposals.push(proposal)
  }

  res.json(all_proposals);
});

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
 * Endpoint: /api/v1/proposal/:template
 * - Creates a blank proposal using template
 */
router.post<{}, MessageResponse>('/proposal/:template_name', (req, res) => {

  let { template_name } = req.params as { template_name: string } || 'default';
  let template_raw = fs.readFileSync(`${__dirname}/../data/templates/proposals/${template_name}.json`, 'utf-8');
  let template = JSON.parse(template_raw);

  let allProposals = fs.readdirSync(`${__dirname}/../data/proposals/`);

  template.id = allProposals.length + 1;
  template.identifier = `Q-TTC-${10000 + template.id}`
  template.createdOnDate = new Date().toISOString();
  template.modifiedOnDate = new Date().toISOString();
  
  res.json(template);
});

/**
 * Method: PUT
 * Endpoint: /api/v1/proposal/:id
 * - Saves the proposal JSON based on the :id
 */
router.put<{}, MessageResponse>('/proposal/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let { payload } = req.body as { payload: any };

  payload.modifiedOnDate = new Date().toISOString();

  fs.writeFileSync(`${__dirname}/../data/proposals/${id}.json`, JSON.stringify(payload, null, 4), 'utf-8');
  
  res.json(payload);
});

export default router;