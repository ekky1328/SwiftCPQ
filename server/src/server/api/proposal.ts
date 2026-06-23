import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';
import { stripBackToProposal } from '../helpers/validators';
import { Proposal, Section, Item, Milestone } from '../../types/Proposal';
import { calculateProposalTotals } from '../helpers/calculation';
import { fromCents, toCents } from '../helpers/money';
import { signRenderToken } from '../helpers/jwt';

const proposalRouter = express.Router();

/** Default proposal template sections for creating new proposals */
const DEFAULT_TEMPLATE_SECTIONS = [
  {
    title: 'Cover Letter',
    type: 'COVER_LETTER',
    order: 1,
    recurrence: null,
    description: '',
    is_optional: false,
    is_locked: true,
    is_reference: false,
    block_removal: true,
  },
  {
    title: 'Default',
    type: 'PRODUCTS',
    order: 2,
    recurrence: 'ONE_TIME',
    description: '',
    is_optional: false,
    is_locked: false,
    is_reference: false,
    block_removal: false,
  },
  {
    title: 'Terms and Conditions',
    type: 'TERMS_AND_CONDITIONS',
    order: 3,
    recurrence: null,
    description: '<p><strong>1. Scope of Work</strong></p><p>The Service Provider will perform the Services as described in the accompanying proposal ("Proposal"). Any additional work requested by the Client beyond the agreed scope will require a written change order and may incur additional costs.</p><p><br></p><p><strong>2. Project Timeline</strong></p><p>The timeline for delivery of the Services is outlined in the Proposal. While the Service Provider will make every effort to meet these timelines, they are estimates and may be adjusted due to unforeseen circumstances. Any changes will be communicated promptly to the Client.</p><p><br></p><p><strong>3. Payment Terms</strong></p><p><u>3.1 Fees: </u>Payment terms, including fees, are outlined in the Proposal. All payments are due as specified in the payment schedule.</p><p><u>3.2 Late Payments: </u>Late payments may be subject to a penalty of [X]% per month on the outstanding balance.</p><p><u>3.3 Taxes: </u>The Client is responsible for all applicable taxes unless otherwise specified.</p><p><br></p><p><strong>4. Client Responsibilities</strong></p><p>The Client agrees to provide timely access to relevant personnel, systems, and information required for the execution of the Services.</p><p><br></p><p><strong>5. Ownership and Intellectual Property</strong></p><p><u>5.1 Deliverables: </u>Upon full payment, ownership of the final deliverables will transfer to the Client.</p><p><u>5.2 License: </u>Any software, frameworks, or libraries used by the Service Provider that are not custom-built remain the intellectual property of their respective owners.</p><p><br></p><p><strong>6. Confidentiality</strong></p><p>Both parties agree to maintain the confidentiality of all proprietary and sensitive information shared during the course of the project.</p><p><br></p><p><strong>7. Limitation of Liability</strong></p><p>The Service Provider\'s total liability for any claims related to this Agreement will be limited to the fees paid by the Client for the Services.</p><p><br></p><p><strong>8. Termination</strong></p><p><u>8.1 By Client: </u>The Client may terminate the Agreement with 15 days\' written notice.</p><p><u>8.2 By Service Provider: </u>The Service Provider may terminate the Agreement if the Client fails to meet payment or other obligations under this Agreement, with 15 days\' written notice.</p><p><br></p><p><strong>9. Governing Law</strong></p><p>This Agreement is governed by the laws of [Your Jurisdiction].</p>',
    is_optional: false,
    is_locked: true,
    is_reference: false,
    block_removal: true,
  },
];


/**
 * Maps a database section row to a Section object with camelCase keys.
 */
export function mapSectionFromDb(row: Record<string, unknown>): Section {
  return {
    id: row.id as number,
    title: row.title as string,
    type: row.type as string,
    order: row.order as number,
    recurrance: (row.recurrence as string) || null,
    description: (row.description as string) || '',
    isOptional: row.is_optional as boolean,
    isLocked: row.is_locked as boolean,
    isReference: row.is_reference as boolean,
    blockRemoval: row.block_removal as boolean,
  };
}


/**
 * Maps a database item row to an Item object with camelCase keys and dollar values.
 */
export function mapItemFromDb(row: Record<string, unknown>): Item {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    order: row.order as number,
    qty: row.qty as number,
    cost: fromCents(row.cost as number),
    price: fromCents(row.price as number),
    sku: (row.sku as string) || undefined,
    type: row.type as string,
    isOptional: row.is_optional as boolean,
    margin: fromCents(row.margin as number),
    subtotal: fromCents(row.subtotal as number),
  };
}


/**
 * Maps a database milestone row to a Milestone object with camelCase keys and dollar values.
 */
export function mapMilestoneFromDb(row: Record<string, unknown>): Milestone {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    order: row.order as number,
    dueDate: row.due_date as string,
    amount: fromCents(row.amount as number),
  };
}


/**
 * Fetches a full proposal (with sections, items, milestones, author, customer) by ID.
 */
export async function fetchProposalById(proposalId: string): Promise<Proposal | null> {
  const row = await db('proposal')
    .select(
      'proposal.*',
      'user.first_name as author_first_name',
      'user.last_name as author_last_name',
      'user.username as author_email',
      'user_contact.phone as author_phone',
      'customer.name as customer_name',
      'customer.email as customer_email',
      'customer.phone as customer_phone',
      'customer_contact.first_name as contact_first_name',
      'customer_contact.last_name as contact_last_name',
      'customer_location.address_line1 as customer_street',
      'customer_location.city as customer_city',
      'customer_location.state as customer_state',
      'customer_location.zip_code as customer_postcode',
      'customer_location.country as customer_country',
    )
    .leftJoin('user', 'proposal.user_id', 'user.id')
    .leftJoin('user_contact', 'user.id', 'user_contact.user_id')
    .leftJoin('customer', 'proposal.customer_id', 'customer.id')
    .leftJoin('customer_contact', 'customer.primary_customer_contact_id', 'customer_contact.id')
    .leftJoin('customer_location', 'customer.primary_customer_location_id', 'customer_location.id')
    .where('proposal.id', proposalId)
    .first();

  if (!row) {
    return null;
  }

  // Fetch sections
  const sectionRows = await db('proposal_section')
    .where('proposal_id', proposalId)
    .orderBy('order');

  const sections: Section[] = [];
  for (const sectionRow of sectionRows) {
    const section = mapSectionFromDb(sectionRow);

    // Fetch items for this section
    const itemRows = await db('proposal_section_item')
      .where('section_id', sectionRow.id)
      .orderBy('order');
    if (itemRows.length > 0) {
      section.items = itemRows.map(mapItemFromDb);
    }

    // Fetch milestones for this section
    const milestoneRows = await db('proposal_section_milestone')
      .where('section_id', sectionRow.id)
      .orderBy('order');
    if (milestoneRows.length > 0) {
      section.milestones = milestoneRows.map(mapMilestoneFromDb);
    }

    sections.push(section);
  }

  const proposal: Proposal = {
    id: row.id,
    version: row.version,
    identifier: row.identifier,
    title: row.title,
    description: row.description,
    status: row.status,
    author: {
      firstName: row.author_first_name || '',
      lastName: row.author_last_name || '',
      email: row.author_email || '',
      phone: row.author_phone || undefined,
    },
    customer: {
      name: row.customer_name || '',
      contact: {
        firstName: row.contact_first_name || '',
        lastName: row.contact_last_name || '',
      },
      email: row.customer_email || '',
      phone: row.customer_phone || '',
      address: {
        street: row.customer_street || '',
        city: row.customer_city || '',
        state: row.customer_state || '',
        postcode: row.customer_postcode || '',
        country: row.customer_country || '',
      },
    },
    sections,
  };

  return proposal;
}


/**
 * Fetches CoreSettings from the database for a given tenant.
 */
export async function fetchCoreSettings(tenantId: string): Promise<Record<string, unknown> | null> {
  const settings = await db('tenant_settings').where('tenant_id', tenantId).first();
  if (!settings) return null;

  const theme = settings.proposal_settings_default
    ? await db('tenant_theme').where('id', settings.proposal_settings_default).first()
    : null;

  const contact = settings.contact_information
    ? await db('tenant_contact_information').where('id', settings.contact_information).first()
    : null;

  const address = contact?.address
    ? await db('tenant_address_information').where('id', contact.address).first()
    : null;

  const proposalSettings = settings.proposal_settings
    ? await db('tenant_proposal_setting').where('id', settings.proposal_settings).first()
    : null;

  return {
    prefix: settings.prefix,
    suffix: settings.suffix,
    logo: settings.logo,
    currency: settings.currency,
    timezone: settings.timezone,
    dateFormat: settings.date_format,
    selectedTemplate: settings.selected_template,
    contactInformationDefaults: {
      email: contact?.email || '',
      phone: contact?.phone || '',
      address: {
        street: address?.address_line1 || '',
        city: address?.city || '',
        state: address?.state || '',
        postcode: address?.zip_code || '',
        country: address?.country || '',
      },
    },
    proposalSettingsDefaults: {
      expiry: proposalSettings?.expiry || 14,
      tax: proposalSettings?.tax ?? false,
      taxRate: proposalSettings?.tax_rate || 10,
    },
    theme: {
      primary: theme?.primary || '#ff822d',
      secondary: theme?.secondary || '#2D7FFF',
      accent: theme?.accent || '#CC681F',
    },
  };
}


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/
 * - Gets a list of proposals (without sections)
 */
proposalRouter.get<{}, MessageResponse>('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;

    const rows = await db('proposal')
      .select(
        'proposal.id', 'proposal.version', 'proposal.identifier',
        'proposal.title', 'proposal.description', 'proposal.status',
        'proposal.created_on_date', 'proposal.modified_on_date',
        'user.first_name as author_first_name', 'user.last_name as author_last_name',
        'user.username as author_email',
        'customer.name as customer_name', 'customer.email as customer_email',
        'customer.phone as customer_phone',
      )
      .leftJoin('user', 'proposal.user_id', 'user.id')
      .leftJoin('customer', 'proposal.customer_id', 'customer.id')
      .where('proposal.tenant_id', tenantId);

    const proposals = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      version: row.version,
      identifier: row.identifier,
      title: row.title,
      description: row.description,
      status: row.status,
      author: {
        firstName: row.author_first_name || '',
        lastName: row.author_last_name || '',
        email: row.author_email || '',
      },
      customer: {
        name: row.customer_name || '',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
      },
      createdOnDate: row.created_on_date,
      modifiedOnDate: row.modified_on_date,
    }));

    res.json(proposals);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id
 * - Gets the proposal JSON based on the :id
 * - Optionally includes core settings
 */
proposalRouter.get<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const proposal = await fetchProposalById(id);
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const calculatedProposal = calculateProposalTotals(proposal);

    if (req.query.coreSettings) {
      let tenantId = req.user?.tenantId as string;
      if (!tenantId) {
        const row = await db('proposal').where('id', id).first();
        tenantId = row.tenant_id as string;
      }

      const coreSettings = await fetchCoreSettings(tenantId);

      if (coreSettings) {
        res.json({
          ...coreSettings,
          ...calculatedProposal,
        });
        return;
      }
    }

    res.json(calculatedProposal);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/proposal/:template_name
 * - Creates a blank proposal using the default template
 */
proposalRouter.post<{}, MessageResponse>('/:template_name', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;

    // Generate a sequential identifier
    const countResult = await db('proposal').where('tenant_id', tenantId).count('* as count').first();
    const count = Number(countResult?.count || 0);
    const identifier = String(10000 + count + 1);

    // Insert the proposal
    const [{ id: proposalId }] = await db('proposal').insert({
      tenant_id: tenantId,
      version: 1,
      identifier,
      title: '',
      description: '',
      status: 'DRAFT',
    }).returning('id');

    // Insert template sections
    for (const templateSection of DEFAULT_TEMPLATE_SECTIONS) {
      await db('proposal_section').insert({
        tenant_id: tenantId,
        proposal_id: proposalId,
        ...templateSection,
      });
    }

    // Fetch and return the created proposal
    const proposal = await fetchProposalById(proposalId);
    res.json(proposal as Proposal);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: PUT
 * Endpoint: /api/v1/proposal/:id
 * - Saves the proposal JSON based on the :id
 */
proposalRouter.put<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    let { payload } = req.body as { payload: Record<string, unknown> };

    // Strip CoreSettings keys from the payload
    payload = stripBackToProposal(payload as never) as unknown as Record<string, unknown>;

    // Verify proposal exists
    const existing = await db('proposal').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const tenantId = existing.tenant_id;

    // Snapshot the current state before overwriting
    const currentSections = await db('proposal_section').where('proposal_id', id).orderBy('order');
    const snapshotSections = [];
    for (const sec of currentSections) {
      const items = await db('proposal_section_item').where('section_id', sec.id).orderBy('order');
      const milestones = await db('proposal_section_milestone').where('section_id', sec.id).orderBy('order');
      snapshotSections.push({ ...sec, items, milestones });
    }
    await db('proposal_version').insert({
      proposal_id: id,
      tenant_id: tenantId,
      version: existing.version,
      snapshot: JSON.stringify({
        title: existing.title,
        description: existing.description,
        status: existing.status,
        sections: snapshotSections,
      }),
    });

    // Update the proposal record — version is auto-incremented server-side
    await db('proposal').where('id', id).update({
      version: existing.version + 1,
      identifier: payload.identifier,
      title: payload.title,
      description: payload.description,
      status: payload.status,
    });

    // Delete existing sections (cascades to items and milestones)
    await db('proposal_section').where('proposal_id', id).del();

    // Insert new sections with items and milestones
    const sections = (payload.sections || []) as Record<string, unknown>[];
    for (const sectionData of sections) {
      const items = (sectionData.items || []) as Record<string, unknown>[];
      const milestones = (sectionData.milestones || []) as Record<string, unknown>[];

      const [{ id: sectionId }] = await db('proposal_section').insert({
        tenant_id: tenantId,
        proposal_id: id,
        title: sectionData.title,
        type: sectionData.type,
        order: sectionData.order,
        recurrence: sectionData.recurrance || null,
        description: sectionData.description || '',
        is_optional: sectionData.isOptional || false,
        is_locked: sectionData.isLocked || false,
        is_reference: sectionData.isReference || false,
        block_removal: sectionData.blockRemoval || false,
      }).returning('id');

      if (items.length > 0) {
        await db('proposal_section_item').insert(
          items.map((item) => ({
            tenant_id: tenantId,
            section_id: sectionId,
            order: item.order,
            sku: item.sku || null,
            title: item.title || '',
            description: item.description || '',
            qty: item.qty || 0,
            cost: toCents(item.cost as number || 0),
            price: toCents(item.price as number || 0),
            margin: toCents(item.margin as number || 0),
            subtotal: toCents(item.subtotal as number || 0),
            type: item.type || 'PRODUCT',
            is_optional: item.isOptional || false,
          })),
        );
      }

      if (milestones.length > 0) {
        await db('proposal_section_milestone').insert(
          milestones.map((milestone) => ({
            tenant_id: tenantId,
            section_id: sectionId,
            title: milestone.title || '',
            description: milestone.description || '',
            order: milestone.order,
            due_date: milestone.dueDate || null,
            amount: toCents(milestone.amount as number || 0),
          })),
        );
      }
    }

    // Fetch and return the updated proposal
    const updatedProposal = await fetchProposalById(id);
    res.json(updatedProposal as Proposal);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: DELETE
 * Endpoint: /api/v1/proposal/:id
 * - Deletes a proposal and all its sections, items, and milestones
 */
proposalRouter.delete<{}, MessageResponse>('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await db('proposal').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    await db('proposal').where('id', id).del();
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id/pdf
 * - Generates a PDF for the given proposal and streams it back to the client.
 *   Requires the user to be authenticated (handled by the router-level requireAuth).
 *   Proxies through the templater service which renders the EJS template via headless browser.
 */
proposalRouter.get<{}, MessageResponse>('/:id/pdf', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const proposal = await db('proposal').where('id', id).first();
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    // Get the selected template from tenant settings
    const settings = await db('tenant_settings')
      .where('tenant_id', proposal.tenant_id)
      .first();
    const templateId = settings?.selected_template || 'default';

    const templaterUrl = process.env.TEMPLATER_URL || 'http://localhost:5005';
    const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!serviceToken) {
      res.status(500).json({ message: 'Server misconfiguration: INTERNAL_SERVICE_TOKEN not set' });
      return;
    }

    const tenantId = proposal.tenant_id;
    const renderToken = signRenderToken(id, tenantId);
    const pdfResponse = await fetch(`${templaterUrl}/download/${templateId}/${id}?tenantId=${tenantId}`, {
      headers: {
        'x-service-token': serviceToken,
        'x-render-token': renderToken,
      },
    });

    if (!pdfResponse.ok) {
      const body = await pdfResponse.text();
      console.error('Templater error:', body);
      res.status(502).json({ message: 'PDF generation failed' });
      return;
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id/versions/:versionId
 * - Returns the full snapshot of a single version, transformed to the standard API format.
 */
proposalRouter.get<{}, MessageResponse>('/:id/versions/:versionId', async (req, res, next) => {
  try {
    const { id, versionId } = req.params as { id: string; versionId: string };

    const versionRow = await db('proposal_version')
      .where('id', versionId)
      .where('proposal_id', id)
      .first();

    if (!versionRow) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    const snapshot = typeof versionRow.snapshot === 'string'
      ? JSON.parse(versionRow.snapshot)
      : versionRow.snapshot;

    const sections = (snapshot.sections || []).map((sec: Record<string, unknown>) => ({
      ...mapSectionFromDb(sec),
      items: ((sec.items as Record<string, unknown>[]) || []).map(mapItemFromDb),
      milestones: ((sec.milestones as Record<string, unknown>[]) || []).map(mapMilestoneFromDb),
    }));

    res.json({
      id: versionRow.id,
      version: versionRow.version,
      createdOnDate: versionRow.created_on_date,
      title: snapshot.title,
      description: snapshot.description,
      status: snapshot.status,
      sections,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Method: GET
 * Endpoint: /api/v1/proposal/:id/versions
 * - Returns metadata for all saved versions of a proposal, newest first.
 */
proposalRouter.get<{}, MessageResponse>('/:id/versions', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await db('proposal').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const versions = await db('proposal_version')
      .where('proposal_id', id)
      .select('id', 'version', 'created_on_date')
      .orderBy('version', 'desc');

    res.json(versions.map((v: Record<string, unknown>) => ({
      id: v.id,
      version: v.version,
      createdOnDate: v.created_on_date,
    })));
  } catch (err) {
    next(err);
  }
});


/**
 * Method: POST
 * Endpoint: /api/v1/proposal/:id/revert/:versionId
 * - Restores a proposal to a previously snapshotted version.
 *   Snapshots the current state first so the revert itself is undoable.
 */
proposalRouter.post<{}, MessageResponse>('/:id/revert/:versionId', async (req, res, next) => {
  try {
    const { id, versionId } = req.params as { id: string; versionId: string };

    const existing = await db('proposal').where('id', id).first();
    if (!existing) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const versionRow = await db('proposal_version')
      .where('id', versionId)
      .where('proposal_id', id)
      .first();
    if (!versionRow) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    const tenantId = existing.tenant_id;

    // Snapshot current state so the revert is undoable
    const currentSections = await db('proposal_section').where('proposal_id', id).orderBy('order');
    const snapshotSections = [];
    for (const sec of currentSections) {
      const items = await db('proposal_section_item').where('section_id', sec.id).orderBy('order');
      const milestones = await db('proposal_section_milestone').where('section_id', sec.id).orderBy('order');
      snapshotSections.push({ ...sec, items, milestones });
    }
    await db('proposal_version').insert({
      proposal_id: id,
      tenant_id: tenantId,
      version: existing.version,
      snapshot: JSON.stringify({
        title: existing.title,
        description: existing.description,
        status: existing.status,
        sections: snapshotSections,
      }),
    });

    // Parse snapshot (Postgres may return it already as an object)
    const snapshot = typeof versionRow.snapshot === 'string'
      ? JSON.parse(versionRow.snapshot)
      : versionRow.snapshot;

    // Restore proposal fields
    await db('proposal').where('id', id).update({
      version: existing.version + 1,
      title: snapshot.title,
      description: snapshot.description,
      status: snapshot.status,
    });

    // Restore sections, items, milestones from snapshot
    await db('proposal_section').where('proposal_id', id).del();

    for (const sectionData of snapshot.sections) {
      const [{ id: sectionId }] = await db('proposal_section').insert({
        tenant_id: tenantId,
        proposal_id: id,
        title: sectionData.title,
        type: sectionData.type,
        order: sectionData.order,
        recurrence: sectionData.recurrence || null,
        description: sectionData.description || '',
        is_optional: sectionData.is_optional || false,
        is_locked: sectionData.is_locked || false,
        is_reference: sectionData.is_reference || false,
        block_removal: sectionData.block_removal || false,
      }).returning('id');

      if (sectionData.items?.length > 0) {
        await db('proposal_section_item').insert(
          sectionData.items.map((item: Record<string, unknown>) => ({
            tenant_id: tenantId,
            section_id: sectionId,
            order: item.order,
            sku: item.sku || null,
            title: item.title || '',
            description: item.description || '',
            qty: item.qty || 0,
            cost: item.cost || 0,
            price: item.price || 0,
            margin: item.margin || 0,
            subtotal: item.subtotal || 0,
            type: item.type || 'PRODUCT',
            is_optional: item.is_optional || false,
          })),
        );
      }

      if (sectionData.milestones?.length > 0) {
        await db('proposal_section_milestone').insert(
          sectionData.milestones.map((ms: Record<string, unknown>) => ({
            tenant_id: tenantId,
            section_id: sectionId,
            title: ms.title || '',
            description: ms.description || '',
            order: ms.order,
            due_date: ms.due_date || null,
            amount: ms.amount || 0,
          })),
        );
      }
    }

    const updatedProposal = await fetchProposalById(id);
    res.json(updatedProposal as Proposal);
  } catch (err) {
    next(err);
  }
});


export default proposalRouter;