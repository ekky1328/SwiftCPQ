import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';

import { toCents } from '../../server/helpers/money';
import { hashPassword } from '../../server/helpers/passwords';

import { user } from '../schema/user';
import { settings, tenant, tenantAddressInformation, tenantContactInformation, tenantProposalSettings, tenantTheme } from '../schema/tenant';
import { item, milestone, proposal, section } from '../schema/proposal';
import { customer, customerContact, customerLocation } from '../schema/customer';

import { exampleProposal } from './exampleProposal';
  
import { db } from '../index';

async function main() {

  console.log(`🚀 Starting Seed Script`)

  /** Tenant Creation */
  const tenantData: typeof tenant.$inferInsert = {
    name: "Dunder Mifflin",
    domain: "dunder-mifflin",
    status: 'ACTIVE'
  }
  const createdTenant = await db.insert(tenant).values(tenantData).returning();
  const tenantId = createdTenant[0].id;

  const settingsData : typeof settings.$inferInsert = {
    tenantId,
    prefix: "S-CPQ",
    suffix: "",
    logo: "default.svg",
    currency: "AUD",
    timezone: "Australia/Sydney",
    dateFormat: "YYYY-MM-DD",
  };
  const createdsettingsData = await db.insert(settings).values(settingsData).returning();

  const tenantAddressInformationData : typeof tenantAddressInformation.$inferInsert = {
    tenantId,
    addressLine1: "1725 Slough Avenue",
    city: "Scranton",
    state: "Pennsylvania",
    zipCode: "18447",
    country: "United States"
  };
  const createdtenantAddressInformationData = await db.insert(tenantAddressInformation).values(tenantAddressInformationData).returning();

  const tenantContactInformationData : typeof tenantContactInformation.$inferInsert = {
    tenantId,
    addressId: createdtenantAddressInformationData[0].id,
    email: "sales@dundermifflin.com",
    phone: "1800 984 3672",
  };
  const createdtenantContactInformationData = await db.insert(tenantContactInformation).values(tenantContactInformationData).returning();

  const tenantProposalSettingsData : typeof tenantProposalSettings.$inferInsert = {
    tenantId,
    expiry: 14,
    tax: false,
    taxRate: 10
  };
  const createdtenantProposalSettingsData = await db.insert(tenantProposalSettings).values(tenantProposalSettingsData).returning();

  const tenantThemeData : typeof tenantTheme.$inferInsert = {
      tenantId,
      primary: "#ff822d",
      secondary: "#2D7FFF",
      accent: "#CC681F"
  };
  const createdtenantThemeData = await db.insert(tenantTheme).values(tenantThemeData).returning();

  const settingsUpdateData = {
    contactInformation : createdtenantContactInformationData[0].id,
    proposalSettings : createdtenantProposalSettingsData[0].id,
    theme : createdtenantThemeData[0].id
  }
  await db.update(settings).set(settingsUpdateData).where( and(eq( settings.id, createdsettingsData[0].id ), eq( settings.tenantId, tenantId )) );

  console.log(`   ✅ Created Tenant Data`)

  /** User Creation */
  const userDataPrimary: typeof user.$inferInsert = {
    tenantId,
    title: 'Regional Manager',
    firstName: "Michael",
    lastName: "Scott",
    description: "",
    username: "m.scott@dundermifflin.com",
    passwordHash: await hashPassword("Dunder_M1fflin_$ux!")
  }
  const createdUserPrimaryData = await db.insert(user).values(userDataPrimary).returning();
  const primaryUserId = createdUserPrimaryData[0].id;

  // Update tenant
  const tenantUpdateData = {
    adminUserId : primaryUserId,
  }
  await db.update(tenant).set(tenantUpdateData).where(eq(tenant.id, tenantId));
  console.log(`      ✅ Update Tenant w/ Admin User ID`)

  const userDataSecondary: typeof user.$inferInsert = {
    tenantId,
    title: 'Assistant to the Regional Manager',
    firstName: "Dwight",
    lastName: "Schrute",
    description: "",
    username: "d.schrute@dundermifflin.com",
    passwordHash: await hashPassword("Dunder_M1fflin_Rule$!")
  }
  const createdUserSecondaryData = await db.insert(user).values(userDataSecondary).returning();
  const secondaryUserId = createdUserSecondaryData[0].id;

  console.log(`   ✅ Created User Data`)

  /** Customer Creation */
  const customerCreationData: typeof customer.$inferInsert = {
    tenantId,
    name: "ACME Solutions",
    email: "contact@acmesolutions.com",
    phone: "+1-800-555-4832",
  }
  const createdCustomer = await db.insert(customer).values(customerCreationData).returning();
  const customerId = createdCustomer[0].id;

  const customerLocationCreationData: typeof customerLocation.$inferInsert = {
    tenantId,
    customerId,
    addressLine1: "123 Main St",
    city: "Anytown",
    state: "CA",
    zipCode: "90210",
    country: "United States",
  }
  const createdCustomerLocation = await db.insert(customerLocation).values(customerLocationCreationData).returning();
  const customerLocationId = createdCustomerLocation[0].id;

  const customerContactCreationData: typeof customerContact.$inferInsert = {
    tenantId,
    firstName: "John",
    lastName: "Doe",
    title: "General Manager",
    email: "john.doe@acmesolutions.net",
    phone: "+1-800-555-4832",
    customerId: customerId,
    locationId: customerLocationId,
  }
  const createdCustomerContact = await db.insert(customerContact).values(customerContactCreationData).returning();
  const customerContactId = createdCustomerContact[0].id;

  const customerUpdateData = {
    primaryContactId: customerContactId,
    primaryLocationId: customerLocationId
  }
  await db.update(customer).set(customerUpdateData).where( and(eq( customer.id, customerId ), eq( customer.tenantId, tenantId )) );

  console.log(`   ✅ Created Customer Data`)

  /** Proposal Creation */
  const { sections, ...restOfProposal} = exampleProposal;
  const proposalCreationData: typeof proposal.$inferInsert = {
    tenantId,
    ...restOfProposal,
    status: 'DRAFT',
    userId: secondaryUserId,
    customerId: customerId,
  }
  const createdProposalData = await db.insert(proposal).values(proposalCreationData).returning();
  const proposalId = createdProposalData[0].id;

  for (let i = 0; i < sections.length; i++) {
    const {id, items, milestones, ...sectionData} = sections[i];

    // @ts-ignore
    const sectionCreationData: typeof section.$inferInsert = {
        tenantId,
        proposalId,
        ...sectionData
    }
    const createdSectionData = await db.insert(section).values(sectionCreationData).returning();
    const sectionId = createdSectionData[0].id;

    if (items) {
      for (let j = 0; j < items.length; j++) {
        const { cost, price, margin, subtotal, ...itemData } = items[j];

        // @ts-ignore
        const itemCreationData: typeof item.$inferInsert = {
          tenantId,
          sectionId,
          ...itemData,
          cost: toCents(cost), 
          price: toCents(price), 
          margin: toCents(margin), 
          subtotal: toCents(subtotal)
        }
        await db.insert(item).values(itemCreationData);

      }
    }

    if (milestones) {
      for (let j = 0; j < milestones.length; j++) {
        const {amount, ...milestoneData} = milestones[j];
        
        // @ts-ignore
        const milestoneCreationData: typeof milestone.$inferInsert = {
          tenantId,
          sectionId,
          ...milestoneData,
          amount: toCents(amount)
        }
        await db.insert(milestone).values(milestoneCreationData);

      }
    }

  }

  console.log(`   ✅ Created Proposal Data`)

  console.log(`🏁 All Done Seeding Database`)
}

main();
