import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';
import { calculateProposalTotals } from '../helpers/calculation';
import { fetchProposalById, fetchCoreSettings } from './proposal';

const renderRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/render/proposal/:id
 * - Returns proposal data for rendering, scoped to the token's proposalId + tenantId.
 * - Only accepts x-render-token (short-lived, proposal-scoped JWT).
 * - No user auth, no service token - intentionally minimal surface area.
 */
renderRouter.get<{}, MessageResponse>('/proposal/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const renderToken = req.renderToken!;

    if (renderToken.proposalId !== id) {
      res.status(403).json({ message: 'Forbidden: token not valid for this proposal' });
      return;
    }

    const proposal = await fetchProposalById(id);
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const row = await db('proposal').where('id', id).first();
    if (row.tenant_id !== renderToken.tenantId) {
      res.status(403).json({ message: 'Forbidden: tenant mismatch' });
      return;
    }

    const calculatedProposal = calculateProposalTotals(proposal);
    const coreSettings = await fetchCoreSettings(renderToken.tenantId);

    res.json({ ...coreSettings, ...calculatedProposal });
  } catch (err) {
    next(err);
  }
});

export default renderRouter;
