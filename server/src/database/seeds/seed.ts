import { hashPassword } from '../../server/helpers/passwords';
import { toCents } from '../../server/helpers/money';
import { exampleProposal } from './exampleProposal';

import knex from '../db';

export async function seed(): Promise<void> {
  console.log(`🚀 Starting Seed Script`);

  /** Tenant Creation */
  const [tenantId] = await knex('tenant').insert({
    name: 'Dunder Mifflin',
    subdomain: 'dunder-mifflin',
    status: 'ACTIVE',
    status_reason: 'Initial setup'
  }).returning('id');

  const [settingsId] = await knex('tenant_settings').insert({
    tenant_id: tenantId,
    prefix: 'S-CPQ',
    suffix: '',
    logo: 'default.svg',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    date_format: 'YYYY-MM-DD'
  }).returning('id');

  const [addressId] = await knex('tenant_address_information').insert({
    tenant_id: tenantId,
    address_line1: '1725 Slough Avenue',
    city: 'Scranton',
    state: 'Pennsylvania',
    zip_code: '18447',
    country: 'United States'
  }).returning('id');

  const [contactId] = await knex('tenant_contact_information').insert({
    tenant_id: tenantId,
    address: addressId,
    email: 'sales@dundermifflin.com',
    phone: '1800 984 3672'
  }).returning('id');

  const [proposalSettingsId] = await knex('tenant_proposal_setting').insert({
    tenant_id: tenantId,
    expiry: 14,
    tax: false,
    tax_rate: 10
  }).returning('id');

  const [themeId] = await knex('tenant_theme').insert({
    tenant_id: tenantId,
    primary: '#ff822d',
    secondary: '#2D7FFF',
    accent: '#CC681F'
  }).returning('id');

  await knex('tenant_settings').where({ id: settingsId }).update({
    contact_information: contactId,
    proposal_settings: proposalSettingsId,
    proposal_settings_default: themeId
  });

  console.log(`   ✅ Created Tenant Data`);

  /** User Creation */
  const [primaryUserId] = await knex('user').insert({
    tenant_id: tenantId,
    title: 'Regional Manager',
    first_name: 'Michael',
    last_name: 'Scott',
    username: 'm.scott@dundermifflin.com',
    password_hash: await hashPassword('Dunder_M1fflin_$ux!')
  }).returning('id');

  await knex('tenant').where({ id: tenantId }).update({ admin_user_id: primaryUserId });
  console.log(`      ✅ Updated Tenant w/ Admin User ID`);

  const [secondaryUserId] = await knex('user').insert({
    tenant_id: tenantId,
    title: 'Assistant to the Regional Manager',
    first_name: 'Dwight',
    last_name: 'Schrute',
    username: 'd.schrute@dundermifflin.com',
    password_hash: await hashPassword('Dunder_M1fflin_Rule$!')
  }).returning('id');

  console.log(`   ✅ Created User Data`);

  /** Customer Creation */
  const [customerId] = await knex('customer').insert({
    tenant_id: tenantId,
    name: 'ACME Solutions',
    email: 'contact@acmesolutions.com',
    phone: '+1-800-555-4832'
  }).returning('id');

  const [customerLocationId] = await knex('customer_location').insert({
    tenant_id: tenantId,
    customer_id: customerId,
    address_line1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip_code: '90210',
    country: 'United States'
  }).returning('id');

  const [customerContactId] = await knex('customer_contact').insert({
    tenant_id: tenantId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@acmesolutions.net',
    phone: '+1-800-555-4832',
    customer_id: customerId,
    location_id: customerLocationId
  }).returning('id');

  await knex('customer').where({ id: customerId }).update({
    primary_customer_contact_id: customerContactId,
    primary_customer_location_id: customerLocationId
  });

  console.log(`   ✅ Created Customer Data`);

  /** Proposal Creation */
  const { sections, ...restOfProposal } = exampleProposal;
  const [proposalId] = await knex('proposal').insert({
    ...restOfProposal,
    tenant_id: tenantId,
    version: 1,
    identifier: '12345',
    status: 'DRAFT',
    user_id: secondaryUserId,
    customer_id: customerId
  }).returning('id');

  for (const sectionData of sections) {
    const { items, milestones, ...sectionInfo } = sectionData;
    const [sectionId] = await knex('proposal_section').insert({ tenant_id: tenantId, proposal_id: proposalId, ...sectionInfo }).returning('id');

    if (items) {
      await knex('proposal_section_item').insert(items.map(item => ({
        tenant_id: tenantId,
        section_id: sectionId,
        ...item,
        cost: toCents(item.cost),
        price: toCents(item.price),
        margin: toCents(item.margin),
        subtotal: toCents(item.subtotal)
      })));
    }

    if (milestones) {
      await knex('proposal_section_milestone').insert(milestones.map(milestone => ({
        tenant_id: tenantId,
        section_id: sectionId,
        ...milestone,
        amount: toCents(milestone.amount)
      })));
    }
  }

  console.log(`   ✅ Created Proposal Data`);
  console.log(`🏁 All Done Seeding Database`);
}
