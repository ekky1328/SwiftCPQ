import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { timestamp } from 'drizzle-orm/pg-core';

import * as tenantSchema from '../db/schema/tenant';
import * as userSchema from '../db/schema/user';
import * as customerSchema from '../db/schema/customer';
import * as proposalSchema from '../db/schema/proposal';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...tenantSchema,
    ...userSchema,
    ...customerSchema,
    ...proposalSchema,
  }
});
