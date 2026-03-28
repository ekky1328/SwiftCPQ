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

  let allProposals = [];
  let proposalList = fs.readdirSync(`${__dirname}/../data/proposals/`);
  for (let i = 0; i < proposalList.length; i++) {
    const proposalFilename = proposalList[i];

    const proposalRaw = fs.readFileSync(`${__dirname}/../data/proposals/${proposalFilename}`, 'utf-8');
    if (!proposalRaw) {
      continue;
    }

    const proposal = JSON.parse(proposalRaw);
    if (!proposal) {
      continue;
    }

    delete proposal.sections;

    allProposals.push(proposal)
  }

  res.json(allProposals);
});

/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id
 * - Gets the proposal JSON based on the :id
 */
router.get<{}, MessageResponse>('/proposal/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let rawData = fs.readFileSync(`${__dirname}/../data/proposals/${id}.json`, 'utf-8');
  let jsonData = JSON.parse(rawData);

  res.json(jsonData);
});

/**
 * Method: POST
 * Endpoint: /api/v1/proposal/:template
 * - Creates a blank proposal using template
 */
router.post<{}, MessageResponse>('/proposal/:templateName', (req, res) => {

  let { templateName } = req.params as { templateName: string } || 'default';
  let templateRaw = fs.readFileSync(`${__dirname}/../data/templates/proposals/${templateName}.json`, 'utf-8');
  let template = JSON.parse(templateRaw);

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
