import express from 'express';
import fs from 'fs';
import { eq } from 'drizzle-orm';

import MessageResponse from '../interfaces/MessageResponse';
import { stripBackToProposal } from '../helpers/validators';
import { Proposal } from '../../types/Proposal';
import { calculateProposalTotals } from '../helpers/calculation';

import { db } from '../../db/index'
import { proposal } from '../../db/schema/proposal';
import { user } from '../../db/schema/user';
import { customer, customerContact } from '../../db/schema/customer';

const proposalRouter = express.Router();


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/
 * - Gets a list of proposals
 */
// Helper function to remove specific properties from an object
const removeProperties = <T>(obj: T, keys: string[]): Partial<T> => {
  const result = { ...obj };

  // @ts-ignore
  keys.forEach(key => delete result[key]);
  return result;
};

proposalRouter.get<{}, MessageResponse>('/', async (req, res) => {
  const rawResults = await db
    .select({ proposal: proposal, user: user, customer: customer, contact: customerContact })
    .from(proposal)
    .leftJoin(customer, eq(proposal.customerId, customer.id))
    .leftJoin(user, eq(proposal.userId, user.id))
    .leftJoin(customerContact, eq(customer.primaryContactId, customerContact.id));

  const structuredResults = rawResults.map((row) => {
      const { proposal, customer, contact, user } = row;

      // Remove unwanted properties
      const mutableProposal = removeProperties(proposal, ['customerId', 'userId']);
      const mutableCustomer = removeProperties(customer, ['primaryContactId', 'primaryLocationId']);
      const contactData = contact ? removeProperties(contact, ['customerId', 'locationId', 'tenantId']) : null;
      const userData = contact ? removeProperties(user, ['passwordHash']) : null;

      // Build the nested customer object
      const nestedCustomer = { ...mutableCustomer, contact: contactData };

      return {
        ...mutableProposal,
        user: userData,
        customer: nestedCustomer
      };
  });

  res.json(structuredResults);
});


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id
 * - Gets the proposal JSON based on the :id
 * - Optionally includes core settings
 */
proposalRouter.get<{}, MessageResponse>('/:id', (req, res) => {

  let coreSettings;
  if (req.query.coreSettings) { 
    let raw_data = fs.readFileSync(`${__dirname}/../data/system/core-settings.json`, 'utf-8');
    coreSettings = JSON.parse(raw_data);
  }

  let { id } = req.params as { id: number };
  let raw_data = fs.readFileSync(`${__dirname}/../data/proposals/${id}.json`, 'utf-8');
  let json_data = JSON.parse(raw_data) as Proposal;

  let proposal = calculateProposalTotals(json_data);

  if (coreSettings) {
    res.json({
      ...coreSettings,
      ...proposal
    });
  } 
  
  else {
    res.json(proposal);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/proposal/:template
 * - Creates a blank proposal using template
 */
proposalRouter.post<{}, MessageResponse>('/:template_name', (req, res) => {

  let { template_name } = req.params as { template_name: string } || 'default';
  let template_raw = fs.readFileSync(`${__dirname}/../data/templates/proposals/${template_name}.json`, 'utf-8');
  let template = JSON.parse(template_raw);

  let allProposals = fs.readdirSync(`${__dirname}/../data/proposals/`);

  template.id = allProposals.length + 1;
  template.identifier = `${10000 + template.id}`
  template.createdOnDate = new Date().toISOString();
  template.modifiedOnDate = new Date().toISOString();
  
  res.json(template);
});


/**
 * Method: PUT
 * Endpoint: /api/v1/proposal/:id
 * - Saves the proposal JSON based on the :id
 */
proposalRouter.put<{}, MessageResponse>('/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let { payload } = req.body as { payload: any };

  payload = stripBackToProposal(payload);
  payload.modifiedOnDate = new Date().toISOString();

  fs.writeFileSync(`${__dirname}/../data/proposals/${id}.json`, JSON.stringify(payload, null, 4), 'utf-8');
  
  res.json(payload);
});


export default proposalRouter;