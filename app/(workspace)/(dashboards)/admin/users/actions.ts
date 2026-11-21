"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { roles, user, userRoles } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function assignRole(formData: FormData) {
  const actor = await requireRole("admin", "/admin/users");
  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  if (!userId || userId.length > 255 || !uuidPattern.test(roleId)) redirect("/admin/users?error=invalid");
  const [target, role] = await Promise.all([
    db.select({ id: user.id, email: user.email, emailVerified: user.emailVerified }).from(user).where(eq(user.id, userId)).limit(1),
    db.select({ id: roles.id, key: roles.key }).from(roles).where(eq(roles.id, roleId)).limit(1),
  ]);
  const targetUser = target[0];
  const selectedRole = role[0];
  if (!targetUser || !selectedRole) redirect("/admin/users?error=invalid");
  if (!targetUser.emailVerified) redirect("/admin/users?error=unverified");

  const [existing] = await db.select({ userId: userRoles.userId }).from(userRoles)
    .where(and(eq(userRoles.userId, targetUser.id), eq(userRoles.roleId, selectedRole.id))).limit(1);
  if (existing) redirect("/admin/users?notice=exists");

  await db.transaction(async (tx) => {
    await tx.insert(userRoles).values({ userId: targetUser.id, roleId: selectedRole.id, assignedBy: actor.id }).onConflictDoNothing();
    await writeAudit(tx, {
      actorId: actor.id,
      action: "role.assigned",
      entityType: "user",
      entityId: targetUser.id,
      metadata: { role: selectedRole.key },
    });
  });
  revalidatePath("/admin/users");
}
