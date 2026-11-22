/**
 * Converts arbitrary human text (such as a call title) into a clean,
 * browser-safe URL slug containing only lowercase letters, numbers, and hyphens.
 */
export function toUrlSlug(input: string, maxLength = 120): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/**
 * Gently sanitizes a slug while the user is actively typing in the slug field:
 * converts spaces to hyphens, strips URL-unsafe characters, and collapses
 * repeated hyphens while preserving a single trailing hyphen mid-entry.
 */
export function sanitizeSlugInput(input: string, maxLength = 120): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, maxLength);
}

/**
 * Converts a field or stage label into a valid lowercase snake_case key
 * starting with a letter (`^[a-z][a-z0-9_]*$`).
 */
export function toFieldKey(input: string, maxLength = 80): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, maxLength)
    .replace(/_+$/g, "");
}

/**
 * Gently sanitizes a snake_case key while the user types, converting spaces
 * and hyphens to underscores while preserving a single trailing underscore.
 */
export function sanitizeFieldKeyInput(input: string, maxLength = 80): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]+/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, maxLength);
}
