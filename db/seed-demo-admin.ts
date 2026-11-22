import { config } from "dotenv";
config({ path: ".env.local" });
config();

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const email = "admin@ceda.test";
const name = "Demo Administrator";
const password = "Password123!";

async function seedDemoAdmin() {
  const [{ db }, { account, roles, user, userRoles }, { ensureBuiltinRoles }, { writeAudit }] = await Promise.all([
    import("./index"), import("./schema"), import("../lib/server/builtin-roles"), import("../lib/server/audit"),
  ]);
  try {
    const passwordHash = await hashPassword(password);
    await db.transaction(async (tx) => {
      await ensureBuiltinRoles(tx);
      const [adminRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.key, "admin")).limit(1);
      if (!adminRole) throw new Error("The administrator role could not be initialized.");
      const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
      const userId = existing?.id ?? crypto.randomUUID();
      if (existing) {
        await tx.update(user).set({ name, emailVerified: true }).where(eq(user.id, userId));
      } else {
        await tx.insert(user).values({ id: userId, name, email, emailVerified: true });
      }
      const [credential] = await tx.select({ id: account.id }).from(account).where(and(eq(account.userId, userId), eq(account.providerId, "credential"))).limit(1);
      if (credential) await tx.update(account).set({ password: passwordHash, accountId: userId }).where(eq(account.id, credential.id));
      else await tx.insert(account).values({ id: crypto.randomUUID(), accountId: userId, providerId: "credential", userId, password: passwordHash });
      const [roleLink] = await tx.select({ userId: userRoles.userId }).from(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, adminRole.id))).limit(1);
      if (!roleLink) {
        await tx.insert(userRoles).values({ userId, roleId: adminRole.id, assignedBy: userId });
        await writeAudit(tx, { actorId: userId, action: "role.demo_admin_seeded", entityType: "user", entityId: userId, metadata: { role: "admin", accountEmail: email } });
      }
    });
    console.info("Demo administrator account is ready.");
  } finally {
    await db.$client.end();
  }
}

seedDemoAdmin().catch((error: unknown) => {
  console.error("Demo administrator seed failed.", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
