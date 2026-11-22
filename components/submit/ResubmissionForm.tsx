"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { resubmitIdeaAction } from "@/app/(workspace)/(dashboards)/dashboard/submissions/actions";
import type { SubmissionState } from "@/app/(submissions)/submit/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import type { AttachmentSummary } from "@/lib/attachments";
import {
  createResubmissionSchema,
  type ResubmissionFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { ResubmissionAttachmentsSection } from "./ResubmissionAttachmentsSection";
import {
  RESUBMISSION_FIELD_CLASS,
  ResubmissionFieldControl,
  type ResubmissionField,
} from "./ResubmissionFieldControl";

type Props = {
  ideaId: string;
  title: string;
  summary: string;
  answers: Record<string, unknown>;
  categoryId: string | null;
  fields: ResubmissionField[];
  categories: { id: string; name: string }[];
  existingAttachments: AttachmentSummary[];
};

const initialState: SubmissionState = {};

function buildDefaultAnswers(
  fields: ResubmissionField[],
  answers: Record<string, unknown>,
) {
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
            className={RESUBMISSION_FIELD_CLASS}
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
            className={RESUBMISSION_FIELD_CLASS}
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
            className={RESUBMISSION_FIELD_CLASS}
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

        {fields.map((field) => (
          <ResubmissionFieldControl
            key={field.key}
            field={field}
            register={register}
            error={
              errors.answers?.[field.key]?.message ?? state.fieldErrors?.[field.key]
            }
          />
        ))}

        <ResubmissionAttachmentsSection
          ideaId={ideaId}
          existingAttachments={existingAttachments}
          keptIds={keptIds}
          onToggleKept={toggleKeptAttachment}
          onUploadingChange={setUploadingAttachments}
          errorMessage={state.fieldErrors?.attachments}
        />

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
            className={RESUBMISSION_FIELD_CLASS}
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
