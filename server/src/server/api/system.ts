import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const systemRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/system/core-settings
 * - Gets the system core settings from the database
 */
systemRouter.get<{}, MessageResponse>('/system/core-settings', async (req, res, next) => {
  try {
    const tenant = await db('tenant').where('status', 'ACTIVE').first();
    if (!tenant) {
      res.status(404).json({ message: 'No active tenant found' });
      return;
    }

    const settings = await db('tenant_settings').where('tenant_id', tenant.id).first();
    if (!settings) {
      res.status(404).json({ message: 'Tenant settings not found' });
      return;
    }

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

    const coreSettings = {
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

    res.json(coreSettings);
  } catch (err) {
    next(err);
  }
});

export default systemRouter;
