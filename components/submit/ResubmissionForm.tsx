"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { Download } from "lucide-react";
import { resubmitIdeaAction } from "@/app/(workspace)/(dashboards)/dashboard/submissions/actions";
import type { SubmissionState } from "@/app/(submissions)/submit/actions";
import { AttachmentUploader } from "@/components/submit/AttachmentUploader";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
  type AttachmentSummary,
} from "@/lib/attachments";
import {
  createResubmissionSchema,
  type ResubmissionFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

type Field = {
  key: string;
  label: string;
  helpText: string | null;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "date" | "url";
  required: boolean;
  options: string[] | null;
};

type Props = {
  ideaId: string;
  title: string;
  summary: string;
  answers: Record<string, unknown>;
  categoryId: string | null;
  fields: Field[];
  categories: { id: string; name: string }[];
  existingAttachments: AttachmentSummary[];
};

const initialState: SubmissionState = {};
const fieldClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

function buildDefaultAnswers(fields: Field[], answers: Record<string, unknown>) {
  const defaults: Record<string, string | boolean | string[]> = {};
  for (const field of fields) {
    const value = answers[field.key];
    if (field.type === "checkbox") {
      defaults[field.key] = value === true;
    } else if (field.type === "multiselect") {
      defaults[field.key] = Array.isArray(value) ? value.map(String) : [];
    } else {
      defaults[field.key] = String(value ?? "");
    }
  }
  return defaults;
}

export function ResubmissionForm({
  ideaId,
  title,
  summary,
  answers,
  categoryId,
  fields,
  categories,
  existingAttachments,
}: Props) {
  const [state, action, pending] = useActionState(resubmitIdeaAction, initialState);
  const [keptIds, setKeptIds] = useState<string[]>(() =>
    existingAttachments.map((file) => file.id),
  );
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const schema = useMemo(() => createResubmissionSchema(fields), [fields]);
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<ResubmissionFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title,
      summary,
      categoryId: categoryId ?? "",
      response: "",
      answers: buildDefaultAnswers(fields, answers),
    },
  });

  if (state.referenceNo) {
    return (
      <section
        className="rounded-2xl border border-green-800/20 bg-green-50 p-6"
        aria-live="polite"
      >
        <h2 className="text-xl font-bold text-ceda-ink">Updated version submitted</h2>
        <p className="mt-2 text-sm text-ceda-body">
          Reference {state.referenceNo} is back in review.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white"
        >
          Return to dashboard
        </Link>
      </section>
    );
  }

  function toggleKeptAttachment(id: string) {
    setKeptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function submitValidForm(
    values: ResubmissionFormValues,
    formElement: HTMLFormElement | null,
  ) {
    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("title", values.title);
    formData.set("summary", values.summary);
    formData.set("categoryId", values.categoryId);
    formData.set("response", values.response);

    for (const id of keptIds) {
      formData.append("keepAttachmentId", id);
    }

    // Preserve any hidden attachment inputs rendered by AttachmentUploader.
    if (formElement) {
      const domData = new FormData(formElement);
      for (const [key, val] of domData.entries()) {
        if (
          key !== "ideaId" &&
          key !== "title" &&
          key !== "summary" &&
          key !== "categoryId" &&
          key !== "response" &&
          key !== "keepAttachmentId" &&
          !key.startsWith("answers.")
        ) {
          formData.append(key, val);
        }
      }
    }

    for (const field of fields) {
      const value = values.answers[field.key];
      if (field.type === "checkbox") {
        if (value === true) formData.set(`answer:${field.key}`, "on");
      } else if (field.type === "multiselect") {
        if (Array.isArray(value)) {
          for (const item of value) formData.append(`answer:${field.key}`, item);
        }
      } else if (typeof value === "string") {
        formData.set(`answer:${field.key}`, value);
      }
    }

    startTransition(() => {
      action(formData);
    });
  }

  const titleError = errors.title?.message ?? state.fieldErrors?.title;
  const summaryError = errors.summary?.message ?? state.fieldErrors?.summary;
  const categoryError = errors.categoryId?.message ?? state.fieldErrors?.categoryId;
  const responseError = errors.response?.message ?? state.fieldErrors?.response;

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={(event) => {
          const formElement = event.currentTarget;
          void handleSubmit((values) => submitValidForm(values, formElement))(event);
        }}
        aria-labelledby="resubmit-heading"
        className="space-y-5 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <h2 id="resubmit-heading" className="text-xl font-bold text-ceda-ink">
            Submit a revised version
          </h2>
          <p className="mt-1 text-sm text-ceda-muted">
            Update the details below and explain how you addressed the requested changes. Your previous version remains in the record.
          </p>
        </div>

        {state.error ? (
          <p
            className="rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <div>
          <label htmlFor="title" className="text-sm font-semibold text-ceda-ink">
            Idea title *
          </label>
          <input
            id="title"
            maxLength={255}
            aria-invalid={titleError ? "true" : "false"}
            aria-describedby={titleError ? "title-error" : undefined}
            className={fieldClass}
            {...register("title")}
          />
          <FieldErrorMessage id="title-error" message={titleError} />
        </div>

        <div>
          <label htmlFor="summary" className="text-sm font-semibold text-ceda-ink">
            Idea summary *
          </label>
          <textarea
            id="summary"
            maxLength={5000}
            rows={5}
            aria-invalid={summaryError ? "true" : "false"}
            aria-describedby={summaryError ? "summary-error" : undefined}
            className={fieldClass}
            {...register("summary")}
          />
          <FieldErrorMessage id="summary-error" message={summaryError} />
        </div>

        <div>
          <label htmlFor="categoryId" className="text-sm font-semibold text-ceda-ink">
            Category *
          </label>
          <select
            id="categoryId"
            aria-invalid={categoryError ? "true" : "false"}
            aria-describedby={categoryError ? "category-error" : undefined}
            className={fieldClass}
            {...register("categoryId")}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage id="category-error" message={categoryError} />
        </div>

        {fields.map((field) => {
          const id = `answer-${field.key}`;
          const errorId = `${id}-error`;
          const hintId = `${id}-hint`;
          const error =
            errors.answers?.[field.key]?.message ?? state.fieldErrors?.[field.key];
          const describedBy =
            [field.helpText ? hintId : "", error ? errorId : ""]
              .filter(Boolean)
              .join(" ") || undefined;
          const registration = register(
            `answers.${field.key}` as Path<ResubmissionFormValues>,
          );

          return (
            <div key={field.key}>
              {field.type === "checkbox" ? (
                <label
                  htmlFor={id}
                  className="flex items-start gap-3 text-sm leading-6 text-ceda-body"
                >
                  <input
                    id={id}
                    type="checkbox"
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={describedBy}
                    className="mt-1 h-5 w-5 accent-ceda-burgundy"
                    {...registration}
                  />
                  <span className="font-semibold text-ceda-ink">
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                </label>
              ) : (
                <>
                  {!(
                    field.type === "select" &&
                    field.options &&
                    field.options.length <= 5
                  ) &&
                  field.type !== "multiselect" ? (
                    <label
                      htmlFor={id}
                      className="block text-sm font-semibold text-ceda-ink"
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>
                  ) : null}

                  {field.helpText ? (
                    <p id={hintId} className="mt-1 text-sm text-ceda-muted">
                      {field.helpText}
                    </p>
                  ) : null}

                  {field.type === "textarea" ? (
                    <textarea
                      id={id}
                      maxLength={4000}
                      rows={4}
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    />
                  ) : null}
                  {field.type === "text" ? (
                    <input
                      id={id}
                      type="text"
                      maxLength={4000}
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    />
                  ) : null}
                  {field.type === "number" ? (
                    <input
                      id={id}
                      type="number"
                      step="any"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    />
                  ) : null}
                  {field.type === "date" ? (
                    <input
                      id={id}
                      type="date"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    />
                  ) : null}
                  {field.type === "url" ? (
                    <input
                      id={id}
                      type="url"
                      inputMode="url"
                      maxLength={4000}
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    />
                  ) : null}
                  {field.type === "select" &&
                  field.options &&
                  field.options.length > 5 ? (
                    <select
                      id={id}
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      className={fieldClass}
                      {...registration}
                    >
                      <option value="" disabled>
                        Select an option
                      </option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {field.type === "select" &&
                  field.options &&
                  field.options.length <= 5 ? (
                    <fieldset
                      role="radiogroup"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={describedBy}
                      aria-required={field.required}
                      className="mt-2 space-y-1"
                    >
                      <legend className="mb-1 text-sm font-semibold text-ceda-ink">
                        {field.label}
                        {field.required ? " *" : ""}
                      </legend>
                      {field.options.map((option) => (
                        <label
                          key={option}
                          className="flex min-h-10 items-center gap-3 text-sm text-ceda-body"
                        >
                          <input
                            type="radio"
                            value={option}
                            className="h-5 w-5 accent-ceda-burgundy"
                            {...registration}
                          />
                          {option}
                        </label>
                      ))}
                    </fieldset>
                  ) : null}
                  {field.type === "multiselect" && field.options?.length ? (
                    <fieldset
                      aria-describedby={describedBy}
                      aria-required={field.required}
                      className="mt-2 space-y-1"
                    >
                      <legend className="mb-1 text-sm font-semibold text-ceda-ink">
                        {field.label}
                        {field.required ? " *" : ""}
                      </legend>
                      {field.options.map((option) => (
                        <label
                          key={option}
                          className="flex min-h-10 items-center gap-3 text-sm text-ceda-body"
                        >
                          <input
                            type="checkbox"
                            value={option}
                            aria-invalid={error ? "true" : "false"}
                            className="h-5 w-5 accent-ceda-burgundy"
                            {...registration}
                          />
                          {option}
                        </label>
                      ))}
                    </fieldset>
                  ) : null}
                </>
              )}
              {field.type === "checkbox" && field.helpText ? (
                <p id={hintId} className="mt-1 text-sm text-ceda-muted">
                  {field.helpText}
                </p>
              ) : null}
              <FieldErrorMessage id={errorId} message={error} />
            </div>
          );
        })}

        <fieldset className="space-y-4 rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-ceda-ink">
            Supporting documents
          </legend>
          {existingAttachments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ceda-muted">
                Current version files — uncheck any file you want to omit from the revised version
              </p>
              <ul className="space-y-2">
                {existingAttachments.map((file) => {
                  const checked = keptIds.includes(file.id);
                  const checkboxId = `keep-attachment-${file.id}`;
                  return (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ceda-line bg-white px-3.5 py-2.5"
                    >
                      <label
                        htmlFor={checkboxId}
                        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm text-ceda-body"
                      >
                        <input
                          id={checkboxId}
                          type="checkbox"
                          value={file.id}
                          checked={checked}
                          onChange={() => toggleKeptAttachment(file.id)}
                          className="h-5 w-5 shrink-0 accent-ceda-burgundy"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ceda-ink">
                            {file.fileName}
                          </span>
                          <span className="block text-xs text-ceda-muted">
                            {getAttachmentTypeLabel(file.mimeType, file.fileName)} ·{" "}
                            {formatFileSize(file.fileSize)} ·{" "}
                            {checked ? "Keeping in revision" : "Will not be carried forward"}
                          </span>
                        </span>
                      </label>
                      <a
                        href={getAttachmentDownloadPath(file.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                      >
                        <Download aria-hidden="true" className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <AttachmentUploader
            mode="resubmission"
            ideaId={ideaId}
            existingKeptCount={keptIds.length}
            onUploadingChange={setUploadingAttachments}
          />
          {state.fieldErrors?.attachments ? (
            <p className="text-sm text-red-800" role="alert">
              {state.fieldErrors.attachments}
            </p>
          ) : null}
        </fieldset>

        <div>
          <label htmlFor="response" className="text-sm font-semibold text-ceda-ink">
            Response to feedback *
          </label>
          <p id="response-hint" className="mt-1 text-sm text-ceda-muted">
            Describe what you changed or explain how each point was addressed (at least 20 characters).
          </p>
          <textarea
            id="response"
            maxLength={5000}
            rows={4}
            aria-invalid={responseError ? "true" : "false"}
            aria-describedby={
              responseError ? "response-hint response-error" : "response-hint"
            }
            className={fieldClass}
            {...register("response")}
          />
          <FieldErrorMessage id="response-error" message={responseError} />
        </div>

        <button
          type="submit"
          disabled={pending || uploadingAttachments}
          className="inline-flex min-h-12 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? "Submitting revision…"
            : uploadingAttachments
              ? "Waiting for upload…"
              : "Submit revised version"}
        </button>
      </form>
    </>
  );
}
