import { hashPassword } from '../../server/helpers/passwords';
import { toCents } from '../../server/helpers/money';
import { exampleProposal } from '../data/exampleProposal';

import knex from '../db';

export async function seed(): Promise<void> {
  console.log('🚀 Starting Seed Script');

  /** Tenant Creation */
  const [{ id: tenantId }] = await knex('tenant').insert({
    name: 'Dunder Mifflin',
    subdomain: 'dunder-mifflin',
    status: 'ACTIVE',
    status_reason: 'Initial setup',
  }).returning('id');

  const [{ id: settingsId }] = await knex('tenant_settings').insert({
    tenant_id: tenantId,
    prefix: 'S-CPQ',
    suffix: '',
    logo: 'default.svg',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    date_format: 'YYYY-MM-DD',
    selected_template: 'default',
  }).returning('id');

  const [{ id: addressId }] = await knex('tenant_address_information').insert({
    tenant_id: tenantId,
    address_line1: '1725 Slough Avenue',
    city: 'Scranton',
    state: 'Pennsylvania',
    zip_code: '18447',
    country: 'United States',
  }).returning('id');

  const [{ id: contactId }] = await knex('tenant_contact_information').insert({
    tenant_id: tenantId,
    address: addressId,
    email: 'sales@dundermifflin.com',
    phone: '1800 984 3672',
  }).returning('id');

  const [{ id: proposalSettingsId }] = await knex('tenant_proposal_setting').insert({
    tenant_id: tenantId,
    expiry: 14,
    tax: false,
    tax_rate: 10,
  }).returning('id');

  const [{ id: themeId }] = await knex('tenant_theme').insert({
    tenant_id: tenantId,
    primary: '#ff822d',
    secondary: '#2D7FFF',
    accent: '#CC681F',
  }).returning('id');

  await knex('tenant_settings').where({ id: settingsId }).update({
    contact_information: contactId,
    proposal_settings: proposalSettingsId,
    proposal_settings_default: themeId,
  });

  console.log('   ✅ Created Tenant Data');

  /** User Creation */
  const [{ id: primaryUserId }] = await knex('user').insert({
    tenant_id: tenantId,
    title: 'Regional Manager',
    first_name: 'Michael',
    last_name: 'Scott',
    username: 'm.scott@dundermifflin.com',
    description: 'Regional Manager of Dunder Mifflin Scranton',
    password_hash: await hashPassword('Dunder_M1fflin_$ux!'),
  }).returning('id');

  await knex('tenant').where({ id: tenantId }).update({ admin_user_id: primaryUserId });
  console.log('      ✅ Updated Tenant w/ Admin User ID');

  const [{ id: secondaryUserId }] = await knex('user').insert({
    tenant_id: tenantId,
    title: 'Assistant to the Regional Manager',
    first_name: 'Dwight',
    last_name: 'Schrute',
    username: 'd.schrute@dundermifflin.com',
    description: 'Assistant to the Regional Manager',
    password_hash: await hashPassword('Dunder_M1fflin_Rule$!'),
  }).returning('id');

  console.log('   ✅ Created User Data');

  /** Customer Creation */
  const [{ id: customerId }] = await knex('customer').insert({
    tenant_id: tenantId,
    name: 'ACME Solutions',
    email: 'contact@acmesolutions.com',
    phone: '+1-800-555-4832',
  }).returning('id');

  const [{ id: customerLocationId }] = await knex('customer_location').insert({
    tenant_id: tenantId,
    customer_id: customerId,
    address_line1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip_code: '90210',
    country: 'United States',
  }).returning('id');

  const [{ id: customerContactId }] = await knex('customer_contact').insert({
    tenant_id: tenantId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@acmesolutions.net',
    phone: '+1-800-555-4832',
    role: 'Primary Contact',
    customer_id: customerId,
    location_id: customerLocationId,
  }).returning('id');

  await knex('customer').where({ id: customerId }).update({
    primary_customer_contact_id: customerContactId,
    primary_customer_location_id: customerLocationId,
  });

  console.log('   ✅ Created Customer Data');

  /** Proposal Creation */
  const [{ id: proposalId }] = await knex('proposal').insert({
    tenant_id: tenantId,
    version: 1,
    identifier: '10001',
    title: exampleProposal.title,
    description: exampleProposal.description,
    status: exampleProposal.status,
    user_id: secondaryUserId,
    customer_id: customerId,
  }).returning('id');

  for (const sectionData of exampleProposal.sections) {
    const { items, milestones, ...rest } = sectionData as Record<string, unknown>;

    const [{ id: sectionId }] = await knex('proposal_section').insert({
      tenant_id: tenantId,
      proposal_id: proposalId,
      title: rest.title,
      type: rest.type,
      order: rest.order,
      recurrence: rest.recurrance || null,
      description: rest.description || '',
      is_optional: rest.isOptional || false,
      is_locked: rest.isLocked || false,
      is_reference: rest.isReference || false,
      block_removal: rest.blockRemoval || false,
    }).returning('id');

    if (items && Array.isArray(items)) {
      await knex('proposal_section_item').insert((items as Record<string, unknown>[]).map(item => ({
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
      })));
    }

    if (milestones && Array.isArray(milestones)) {
      await knex('proposal_section_milestone').insert((milestones as Record<string, unknown>[]).map(milestone => ({
        tenant_id: tenantId,
        section_id: sectionId,
        title: milestone.title || '',
        description: milestone.description || '',
        order: milestone.order,
        due_date: milestone.dueDate || null,
        amount: toCents(milestone.amount as number || 0),
      })));
    }
  }

  console.log('   ✅ Created Proposal Data');
  console.log('🏁 All Done Seeding Database');
}
