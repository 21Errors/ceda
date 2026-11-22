import type { CallConfigStepKey } from "@/components/admin/calls/config/types";

export type QueryParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveNewCallError(params: QueryParams): string {
  const error = firstParam(params.error);
  if (error === "title")
    return "Enter a title between 3 and 255 characters.";
  if (error === "slug")
    return "Use a slug with lowercase letters, numbers, and hyphens.";
  if (error === "duplicate")
    return "That URL slug is already used by another call.";
  if (error === "dates")
    return "Check the opening and closing dates; closing must be later.";
  return error ? "Check the call details and try again." : "";
}

export function resolveCallConfigStep(params: QueryParams): CallConfigStepKey {
  const step = firstParam(params.step);
  if (
    step === "fields" ||
    step === "stages" ||
    step === "criteria" ||
    step === "publish"
  ) {
    return step;
  }

  const error = firstParam(params.error);
  if (error === "stage" || error === "stage_duplicate") return "stages";
  if (error === "criterion" || error === "criterion_locked") return "criteria";
  if (error === "status") return "publish";
  return "fields";
}

export function resolveCallConfigError(params: QueryParams): string {
  const error = firstParam(params.error);
  if (error === "duplicate")
    return "That field key is already in use for this call.";
  if (error === "options")
    return "Select fields need unique choices, separated by commas.";
  if (error === "field") return "Check the field key and label.";
  if (error === "criterion")
    return "Check the criterion name, maximum score, and weight.";
  if (error === "criterion_locked")
    return "This criterion already has scores. Archive it and add a new one so past reviews keep their original meaning.";
  if (error === "stage_duplicate")
    return "That workflow key is already used by another stage.";
  if (error === "stage") return "Check the stage name, key, and type.";
  if (error === "status") return "Choose a valid call status and date range.";
  return error ? "Check the configuration and try again." : "";
}

export function resolveAwardsError(params: QueryParams): string {
  const error = firstParam(params.error);
  if (error === "unavailable")
    return "This submission is no longer eligible for an award. Refresh the page and try again.";
  if (error === "configuration")
    return "The opportunity needs an award workflow stage before an award can be granted.";
  return error ? "Enter an award title and check the field limits." : "";
}

export function resolveCategoriesError(params: QueryParams): string {
  const error = firstParam(params.error);
  if (error === "duplicate")
    return "A category with that name already exists.";
  return error ? "Check the category name and description." : "";
}

export function resolveFaqAdminNotice(params: QueryParams): string {
  const notice = firstParam(params.notice);
  if (notice === "saved") return "FAQ saved and the public page refreshed.";
  if (notice === "deleted") return "FAQ removed from the public page.";

  const error = firstParam(params.error);
  if (error === "notfound")
    return "That FAQ no longer exists. Reload the page.";
  return error ? "Check the question, answer, topic and order fields." : "";
}

export function resolveUsersAdminNotice(params: QueryParams): string {
  const notice = firstParam(params.notice);
  if (notice === "exists") return "That role is already assigned.";

  const error = firstParam(params.error);
  if (error === "unverified")
    return "Verify the account email before assigning staff access.";
  return error ? "The user or role could not be found." : "";
}

export function resolveDocumentsAdminFeedback(params: QueryParams): {
  notice: string;
  errorMessage: string;
} {
  const noticeCode = firstParam(params.notice);
  const errorCode = firstParam(params.error);
  const detail = firstParam(params.detail);

  const notice =
    noticeCode === "created"
      ? "Document template uploaded and published to Neon Object Storage."
      : noticeCode === "saved"
        ? "Document template updated and public pages refreshed."
        : noticeCode === "deleted"
          ? "Document template removed from portal and storage."
          : "";

  const errorMessage =
    errorCode === "title"
      ? "Enter a document title between 1 and 255 characters."
      : errorCode === "file"
        ? "Choose a template file to upload."
        : errorCode === "upload"
          ? detail || "The uploaded file could not be accepted."
          : errorCode === "notfound"
            ? "That document template no longer exists. Reload the page."
            : errorCode
              ? "Please check the document details and try again."
              : "";

  return { notice, errorMessage };
}

export function resolvePagesCmsFeedback(params: QueryParams): {
  notice: string;
  errorMessage: string;
} {
  const noticeCode = firstParam(params.notice);
  const errorCode = firstParam(params.error);

  const notice =
    noticeCode === "saved"
      ? "Content block saved and public portal pages refreshed."
      : noticeCode === "created"
        ? "New announcement or guideline section published."
        : noticeCode === "deleted"
          ? "Content block removed and public pages refreshed."
          : "";

  const errorMessage =
    errorCode === "notfound"
      ? "That content block no longer exists. Reload the page."
      : errorCode
        ? "Check the title and body fields (body is required, up to 10,000 characters)."
        : "";

  return { notice, errorMessage };
}
