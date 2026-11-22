import type { FieldErrors, Path } from "react-hook-form";
import type { SubmissionFormValues } from "@/lib/form-schemas";

export interface SubmissionField {
  key: string;
  label: string;
  helpText: string | null;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "date" | "url";
  required: boolean;
  options: string[] | null;
  sectionKey: string;
}

export type SubmissionDraft = {
  id: string;
  categoryId: string | null;
  title: string;
  summary: string;
  answers: Record<string, unknown>;
  termsAccepted: boolean;
} | null;

export const SUBMISSION_SECTIONS = [
  { key: "terms_and_conditions", label: "Terms and Conditions", description: "Name your idea and confirm the terms." },
  { key: "general_information", label: "General Information", description: "Tell us who is applying and where the idea fits." },
  { key: "solution_status", label: "Solution Status", description: "Show how far your solution has progressed." },
  { key: "solution_overview", label: "Solution Overview", description: "Explain the problem and your proposed solution." },
  { key: "type_of_innovation", label: "Type of Innovation", description: "Select the kind of innovation you are proposing." },
  { key: "additional_information", label: "Additional Information", description: "Add the remaining details requested for this opportunity." },
  { key: "solution_documents", label: "Solution Documents", description: "Upload pitch decks and supporting documents, or add prototype links." },
] as const;

export const SOLUTION_STAGES = [
  "Idea or concept",
  "Prototype in development",
  "Pilot or testing",
  "Ready to launch",
  "Already operating",
];

export const INNOVATION_TYPES = [
  "Product",
  "Service",
  "Process",
  "Technology",
  "Business model",
  "Social innovation",
];

export const SUBMISSION_INPUT_CLASS =
  "ds-field-control mt-2 block min-h-12 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

function printValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

export function buildDefaultAnswers(
  fields: SubmissionField[],
  answerValues: Record<string, unknown>,
) {
  const defaults: Record<string, string | boolean | string[]> = {};
  for (const field of fields) {
    const raw = answerValues[field.key];
    if (field.type === "checkbox") {
      defaults[field.key] = raw === true || raw === "true";
    } else if (field.type === "multiselect") {
      defaults[field.key] = Array.isArray(raw) ? raw.map(String) : [];
    } else {
      defaults[field.key] = printValue(raw);
    }
  }
  return defaults;
}

export function buildSubmissionFormData(
  callId: string,
  draftId: string,
  fields: SubmissionField[],
  values: SubmissionFormValues,
): FormData {
  const formData = new FormData();
  formData.set("callId", callId);
  formData.set("draftId", draftId);
  formData.set("title", values.title);
  if (values.termsAccepted) formData.set("termsAccepted", "on");
  formData.set("categoryId", values.categoryId);
  formData.set("solutionStatus", values.solutionStatus);
  formData.set("summary", values.summary);
  for (const type of values.innovationTypes) {
    formData.append("innovationTypes", type);
  }
  for (const field of fields) {
    const value = values.answers[field.key];
    if (field.type === "checkbox") {
      if (value === true) formData.set(`answer:${field.key}`, "on");
    } else if (field.type === "multiselect") {
      if (Array.isArray(value)) {
        for (const item of value) {
          formData.append(`answer:${field.key}`, item);
        }
      }
    } else if (typeof value === "string") {
      formData.set(`answer:${field.key}`, value);
    }
  }
  return formData;
}

export function getSectionFieldPaths(
  sectionIndex: number,
  fields: SubmissionField[],
): Path<SubmissionFormValues>[] {
  const sectionKey = SUBMISSION_SECTIONS[sectionIndex]?.key;
  const dynamicPaths = fields
    .filter((field) => field.sectionKey === sectionKey)
    .map((field) => `answers.${field.key}` as Path<SubmissionFormValues>);

  if (sectionIndex === 0) return ["title", "termsAccepted", ...dynamicPaths];
  if (sectionIndex === 1) return ["categoryId", ...dynamicPaths];
  if (sectionIndex === 2) return ["solutionStatus", ...dynamicPaths];
  if (sectionIndex === 3) return ["summary", ...dynamicPaths];
  if (sectionIndex === 4) return ["innovationTypes", ...dynamicPaths];
  return dynamicPaths;
}

export function findFirstErrorSection(
  formErrors: FieldErrors<SubmissionFormValues>,
  fields: SubmissionField[],
): number {
  if (formErrors.title || formErrors.termsAccepted) return 0;
  if (formErrors.categoryId) return 1;
  if (formErrors.solutionStatus) return 2;
  if (formErrors.summary) return 3;
  if (formErrors.innovationTypes) return 4;
  if (formErrors.answers) {
    for (const field of fields) {
      if (formErrors.answers[field.key]) {
        const sectionIndex = SUBMISSION_SECTIONS.findIndex((s) => s.key === field.sectionKey);
        if (sectionIndex >= 0) return sectionIndex;
      }
    }
  }
  return 0;
}

export function findSectionForServerFieldError(
  fieldKey: string,
  fields: SubmissionField[],
): number {
  const sectionKey =
    fieldKey === "categoryId"
      ? "general_information"
      : fieldKey === "solutionStatus"
        ? "solution_status"
        : fieldKey === "summary"
          ? "solution_overview"
          : fieldKey === "innovationTypes"
            ? "type_of_innovation"
            : fieldKey === "termsAccepted" || fieldKey === "title"
              ? "terms_and_conditions"
              : fields.find((field) => field.key === fieldKey)?.sectionKey;
  return SUBMISSION_SECTIONS.findIndex((section) => section.key === sectionKey);
}
