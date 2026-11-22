import { config } from "dotenv";
config({ path: ".env.local" });
config();

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const SEED_PASSWORD = "Password123!";

const seedUsers = [
  {
    roleKey: "submitter",
    name: "Demo Submitter",
    email: "submitter@ceda.test",
  },
  {
    roleKey: "evaluator",
    name: "Demo Evaluator",
    email: "evaluator@ceda.test",
  },
  {
    roleKey: "adjudicator",
    name: "Demo Adjudicator",
    email: "adjudicator@ceda.test",
  },
  {
    roleKey: "admin",
    name: "Demo Administrator",
    email: "admin@ceda.test",
  },
  {
    roleKey: "consultant",
    name: "Demo Service Consultant",
    email: "consultant@ceda.test",
  },
  {
    roleKey: "committee_member",
    name: "Demo Committee Member",
    email: "committee@ceda.test",
  },
] as const;

let closeDatabase: () => Promise<void> = async () => {};

async function main() {
  const [{ db }, { account, roles, user, userRoles }, { ensureBuiltinRoles }] =
    await Promise.all([
      import("./index"),
      import("./schema"),
      import("../lib/server/builtin-roles"),
    ]);

  closeDatabase = () => db.$client.end();

  const passwordHash = await hashPassword(SEED_PASSWORD);

  await db.transaction(async (tx) => {
    await ensureBuiltinRoles(tx);

    const allRoles = await tx
      .select({ id: roles.id, key: roles.key })
      .from(roles);
    const roleIdByKey = new Map(allRoles.map((r) => [r.key, r.id]));

    for (const entry of seedUsers) {
      const roleId = roleIdByKey.get(entry.roleKey);
      if (!roleId) {
        throw new Error(`Role "${entry.roleKey}" not found in roles table.`);
      }

      const [existingUser] = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, entry.email))
        .limit(1);

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        await tx
          .update(user)
          .set({ name: entry.name, emailVerified: true })
          .where(eq(user.id, userId));
      } else {
        userId = crypto.randomUUID();
        await tx.insert(user).values({
          id: userId,
          name: entry.name,
          email: entry.email,
          emailVerified: true,
        });
      }

      const [existingAccount] = await tx
        .select({ id: account.id })
        .from(account)
        .where(
          and(
            eq(account.userId, userId),
            eq(account.providerId, "credential"),
          ),
        )
        .limit(1);

      if (existingAccount) {
        await tx
          .update(account)
          .set({ password: passwordHash, accountId: userId })
          .where(eq(account.id, existingAccount.id));
      } else {
        await tx.insert(account).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
        });
      }

      await tx
        .insert(userRoles)
        .values({
          userId,
          roleId,
          assignedBy: userId,
        })
        .onConflictDoNothing();
    }
  });

  console.info(`Seeded ${seedUsers.length} users (one per role).`);
  await db.$client.end();
}

main().catch(async (error: unknown) => {
  console.error("User seed failed.", error);
  await closeDatabase();
  process.exitCode = 1;
});
