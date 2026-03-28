import express from 'express';

import db from '../../database/db';
import MessageResponse from '../interfaces/MessageResponse';

const systemRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/system/core-settings
 * - Gets the system core settings from the database
 */
systemRouter.get<{}, MessageResponse>('/core-settings', async (req, res, next) => {
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
      staleInventoryDays: settings.stale_inventory_days ?? 28,
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


/**
 * Method: PUT
 * Endpoint: /api/v1/system/core-settings
 * - Updates the system core settings
 */
systemRouter.put<{}, MessageResponse>('/core-settings', async (req, res, next) => {
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

    const {
      prefix, suffix, logo, currency, timezone, dateFormat, selectedTemplate,
      contactInformationDefaults, proposalSettingsDefaults, theme,
    } = req.body;

    // Update tenant_settings
    const settingsUpdate: Record<string, unknown> = {};
    if (prefix !== undefined) settingsUpdate.prefix = prefix;
    if (suffix !== undefined) settingsUpdate.suffix = suffix;
    if (logo !== undefined) settingsUpdate.logo = logo;
    if (currency !== undefined) settingsUpdate.currency = currency;
    if (timezone !== undefined) settingsUpdate.timezone = timezone;
    if (dateFormat !== undefined) settingsUpdate.date_format = dateFormat;
    if (selectedTemplate !== undefined) settingsUpdate.selected_template = selectedTemplate;

    const { staleInventoryDays } = req.body;
    if (staleInventoryDays !== undefined) settingsUpdate.stale_inventory_days = staleInventoryDays;

    if (Object.keys(settingsUpdate).length > 0) {
      await db('tenant_settings').where('id', settings.id).update(settingsUpdate);
    }

    // Update theme
    if (theme && settings.proposal_settings_default) {
      const themeUpdate: Record<string, unknown> = {};
      if (theme.primary !== undefined) themeUpdate.primary = theme.primary;
      if (theme.secondary !== undefined) themeUpdate.secondary = theme.secondary;
      if (theme.accent !== undefined) themeUpdate.accent = theme.accent;

      if (Object.keys(themeUpdate).length > 0) {
        await db('tenant_theme').where('id', settings.proposal_settings_default).update(themeUpdate);
      }
    }

    // Update contact information
    if (contactInformationDefaults && settings.contact_information) {
      const contactUpdate: Record<string, unknown> = {};
      if (contactInformationDefaults.email !== undefined) contactUpdate.email = contactInformationDefaults.email;
      if (contactInformationDefaults.phone !== undefined) contactUpdate.phone = contactInformationDefaults.phone;

      if (Object.keys(contactUpdate).length > 0) {
        await db('tenant_contact_information').where('id', settings.contact_information).update(contactUpdate);
      }

      // Update address
      if (contactInformationDefaults.address) {
        const contact = await db('tenant_contact_information').where('id', settings.contact_information).first();
        if (contact?.address) {
          const addressUpdate: Record<string, unknown> = {};
          if (contactInformationDefaults.address.street !== undefined) addressUpdate.address_line1 = contactInformationDefaults.address.street;
          if (contactInformationDefaults.address.city !== undefined) addressUpdate.city = contactInformationDefaults.address.city;
          if (contactInformationDefaults.address.state !== undefined) addressUpdate.state = contactInformationDefaults.address.state;
          if (contactInformationDefaults.address.postcode !== undefined) addressUpdate.zip_code = contactInformationDefaults.address.postcode;
          if (contactInformationDefaults.address.country !== undefined) addressUpdate.country = contactInformationDefaults.address.country;

          if (Object.keys(addressUpdate).length > 0) {
            await db('tenant_address_information').where('id', contact.address).update(addressUpdate);
          }
        }
      }
    }

    // Update proposal settings
    if (proposalSettingsDefaults && settings.proposal_settings) {
      const proposalUpdate: Record<string, unknown> = {};
      if (proposalSettingsDefaults.expiry !== undefined) proposalUpdate.expiry = proposalSettingsDefaults.expiry;
      if (proposalSettingsDefaults.tax !== undefined) proposalUpdate.tax = proposalSettingsDefaults.tax;
      if (proposalSettingsDefaults.taxRate !== undefined) proposalUpdate.tax_rate = proposalSettingsDefaults.taxRate;

      if (Object.keys(proposalUpdate).length > 0) {
        await db('tenant_proposal_setting').where('id', settings.proposal_settings).update(proposalUpdate);
      }
    }

    // Return updated settings (re-fetch to get current state)
    const updatedSettings = await db('tenant_settings').where('tenant_id', tenant.id).first();
    const updatedTheme = updatedSettings.proposal_settings_default
      ? await db('tenant_theme').where('id', updatedSettings.proposal_settings_default).first()
      : null;
    const updatedContact = updatedSettings.contact_information
      ? await db('tenant_contact_information').where('id', updatedSettings.contact_information).first()
      : null;
    const updatedAddress = updatedContact?.address
      ? await db('tenant_address_information').where('id', updatedContact.address).first()
      : null;
    const updatedProposalSettings = updatedSettings.proposal_settings
      ? await db('tenant_proposal_setting').where('id', updatedSettings.proposal_settings).first()
      : null;

    res.json({
      prefix: updatedSettings.prefix,
      suffix: updatedSettings.suffix,
      logo: updatedSettings.logo,
      currency: updatedSettings.currency,
      timezone: updatedSettings.timezone,
      dateFormat: updatedSettings.date_format,
      selectedTemplate: updatedSettings.selected_template,
      staleInventoryDays: updatedSettings.stale_inventory_days ?? 28,
      contactInformationDefaults: {
        email: updatedContact?.email || '',
        phone: updatedContact?.phone || '',
        address: {
          street: updatedAddress?.address_line1 || '',
          city: updatedAddress?.city || '',
          state: updatedAddress?.state || '',
          postcode: updatedAddress?.zip_code || '',
          country: updatedAddress?.country || '',
        },
      },
      proposalSettingsDefaults: {
        expiry: updatedProposalSettings?.expiry || 14,
        tax: updatedProposalSettings?.tax ?? false,
        taxRate: updatedProposalSettings?.tax_rate || 10,
      },
      theme: {
        primary: updatedTheme?.primary || '#ff822d',
        secondary: updatedTheme?.secondary || '#2D7FFF',
        accent: updatedTheme?.accent || '#CC681F',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default systemRouter;
