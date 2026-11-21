"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

export async function createCategory(formData: FormData) {
  const admin = await requireRole("admin", "/admin/categories");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 150 || description.length > 2000) redirect("/admin/categories?error=invalid");
  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, name)).limit(1);
  if (existing) redirect("/admin/categories?error=duplicate");
  const [last] = await db.select({ position: categories.position }).from(categories).orderBy(desc(categories.position)).limit(1);
  await db.transaction(async (tx) => {
    const [category] = await tx.insert(categories).values({ name, description: description || null, position: (last?.position ?? -1) + 1 }).returning({ id: categories.id });
    if (category) await writeAudit(tx, { actorId: admin.id, action: "category.created", entityType: "category", entityId: category.id, metadata: { name } });
  });
  revalidatePath("/admin/categories");
  revalidatePath("/submit");
}

export async function updateCategory(formData: FormData) {
  const admin = await requireRole("admin", "/admin/categories");
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(categoryId) || name.length < 2 || name.length > 150 || description.length > 2000) redirect("/admin/categories?error=invalid");
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) redirect("/admin/categories?error=invalid");
  const [duplicate] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.name, name), ne(categories.id, categoryId))).limit(1);
  if (duplicate) redirect("/admin/categories?error=duplicate");
  await db.transaction(async (tx) => {
    await tx.update(categories).set({ name, description: description || null }).where(eq(categories.id, categoryId));
    await writeAudit(tx, { actorId: admin.id, action: "category.updated", entityType: "category", entityId: categoryId, metadata: { name } });
  });
  revalidatePath("/admin/categories");
  revalidatePath("/submit");
}

export async function setCategoryActive(formData: FormData) {
  const admin = await requireRole("admin", "/admin/categories");
  const categoryId = String(formData.get("categoryId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(categoryId)) redirect("/admin/categories?error=invalid");
  const [category] = await db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) redirect("/admin/categories?error=invalid");
  await db.transaction(async (tx) => {
    await tx.update(categories).set({ isActive }).where(eq(categories.id, categoryId));
    await writeAudit(tx, { actorId: admin.id, action: isActive ? "category.activated" : "category.deactivated", entityType: "category", entityId: categoryId, metadata: { name: category.name } });
  });
  revalidatePath("/admin/categories");
  revalidatePath("/submit");
}
