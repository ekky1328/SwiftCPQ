import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { user, userContact } from '../schema/user';
import { tenant } from '../schema/tenant';
  
const db = drizzle(process.env.DATABASE_URL!);

async function main() {

  const tenantData: typeof tenant.$inferInsert = {
    id: 1,
    name: "Dunder Mifflin",
    domain: "dunder-mifflin",
    status: 'ACTIVE',
    adminUserId: 1
  }
  await db.insert(tenant).values(tenantData);

  const userData: typeof user.$inferInsert = {
    id: 1,
    firstName: "Michael",
    lastName: "Scott",
    username: "m.scott@dundermifflin.com",
    passwordHash: 
  }

  const userData: typeof user.$inferInsert = {
    firstName: "Dwight",
    lastName: "Schrute",
    username: "d.schrute@dundermifflin.com",
    passwordHash: 
  }

//   const user: typeof usersTable.$inferInsert = {
//     name: 'John',
//     age: 30,
//     email: 'john@example.com',
//   };

//   await db.insert(usersTable).values(user);
//   console.log('New user created!')

//   const users = await db.select().from(usersTable);
//   console.log('Getting all users from the database: ', users)
//   /*
//   const users: {
//     id: number;
//     name: string;
//     age: number;
//     email: string;
//   }[]
//   */

//   await db
//     .update(usersTable)
//     .set({
//       age: 31,
//     })
//     .where(eq(usersTable.email, user.email));
//   console.log('User info updated!')

//   await db.delete(usersTable).where(eq(usersTable.email, user.email));
//   console.log('User deleted!')
}

main();
