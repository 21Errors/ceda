/** Dynamic call fields that duplicate account names are supplied by the profile. */
const PROFILE_NAME_KEYS = new Set([
  "first_name",
  "last_name",
  "full_name",
  "applicant_name",
  "applicant_full_name",
  "submitter_name",
]);

export function isProfileNameField(field: { key: string; label: string }): boolean {
  const key = field.key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const label = field.label.trim().toLowerCase().replace(/[\s-]+/g, " ");
  return PROFILE_NAME_KEYS.has(key) ||
    /^(first name|last name|full name|applicant name|applicant full name|submitter name)$/.test(label);
}
