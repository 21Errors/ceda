"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FileText } from "lucide-react";
import type { SubmissionState } from "@/app/(submissions)/submit/actions";
import { AttachmentUploader } from "@/components/submit/AttachmentUploader";
import { ReadinessChecker } from "@/components/submit/ReadinessChecker";
import { FieldErrorMessage } from "@/components/ui/FormErrorFeedback";
import type { AttachmentSummary } from "@/lib/attachments";
import type { SubmissionFormValues } from "@/lib/form-schemas";
import type { IdeaReadinessResult } from "@/lib/idea-readiness";
import { DynamicFieldControl } from "./DynamicFieldControl";
import {
  INNOVATION_TYPES,
  SOLUTION_STAGES,
  SUBMISSION_INPUT_CLASS,
  type SubmissionField,
} from "./submission-config";

interface SubmissionStepFieldsProps {
  stepIndex: number;
  fields: SubmissionField[];
  categories: { id: string; name: string; description: string | null }[];
  register: UseFormRegister<SubmissionFormValues>;
  errors: FieldErrors<SubmissionFormValues>;
  serverFieldErrors?: SubmissionState["fieldErrors"];
  draftId: string;
  ensureDraftId: () => Promise<string | null>;
  initialAttachments: AttachmentSummary[];
  onUploadingChange: (uploading: boolean) => void;
  onAttachmentCountChange: (count: number) => void;
  readiness: IdeaReadinessResult;
  onJumpToSection: (index: number) => void;
}

function SectionDynamicFields({
  sectionKey,
  fields,
  register,
  errors,
  serverFieldErrors,
}: {
  sectionKey: string;
  fields: SubmissionField[];
  register: UseFormRegister<SubmissionFormValues>;
  errors: FieldErrors<SubmissionFormValues>;
  serverFieldErrors?: SubmissionState["fieldErrors"];
}) {
  return (
    <>
      {fields
        .filter((field) => field.sectionKey === sectionKey)
        .map((field) => (
          <DynamicFieldControl
            key={field.key}
            field={field}
            register={register}
            error={
              errors.answers?.[field.key]?.message ?? serverFieldErrors?.[field.key]
            }
          />
        ))}
    </>
  );
}

export function SubmissionStepFields({
  stepIndex,
  fields,
  categories,
  register,
  errors,
  serverFieldErrors,
  draftId,
  ensureDraftId,
  initialAttachments,
  onUploadingChange,
  onAttachmentCountChange,
  readiness,
  onJumpToSection,
}: SubmissionStepFieldsProps) {
  const titleError = errors.title?.message ?? serverFieldErrors?.title;
  const termsError = errors.termsAccepted?.message ?? serverFieldErrors?.termsAccepted;
  const categoryError = errors.categoryId?.message ?? serverFieldErrors?.categoryId;
  const statusError = errors.solutionStatus?.message ?? serverFieldErrors?.solutionStatus;
  const summaryError = errors.summary?.message ?? serverFieldErrors?.summary;
  const innovationError =
    errors.innovationTypes?.message ?? serverFieldErrors?.innovationTypes;

  if (stepIndex === 0) {
    return (
      <>
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-ceda-ink">
            Idea title <span aria-hidden="true" className="text-ceda-burgundy">*</span>
          </label>
          <p id="title-help" className="mt-1 text-sm text-ceda-muted">
            Give your solution a concise, memorable name (at least 5 characters).
          </p>
          <input
            id="title"
            maxLength={255}
            aria-invalid={titleError ? "true" : "false"}
            aria-describedby={titleError ? "title-help title-error" : "title-help"}
            className={SUBMISSION_INPUT_CLASS}
            {...register("title")}
          />
          <FieldErrorMessage id="title-error" message={titleError} />
        </div>
        <div className="rounded-2xl border border-ceda-line p-4 sm:p-5">
          <label
            htmlFor="termsAccepted"
            className="flex items-start gap-3 text-sm leading-6 text-ceda-body"
          >
            <input
              id="termsAccepted"
              type="checkbox"
              aria-invalid={termsError ? "true" : "false"}
              aria-describedby={termsError ? "terms-error" : undefined}
              className="mt-1 h-5 w-5 accent-ceda-burgundy"
              {...register("termsAccepted")}
            />
            <span>
              <strong className="text-ceda-ink">
                I have read and agree to the Terms and Conditions
              </strong>{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="ml-1 font-semibold text-ceda-burgundy underline underline-offset-4"
              >
                View terms
              </a>
              <span className="mt-1 block text-sm text-ceda-muted">
                Your information will be used to assess this innovation submission and manage the review process.
              </span>
            </span>
          </label>
          <FieldErrorMessage id="terms-error" message={termsError} />
        </div>
        <div className="rounded-xl bg-[#FFF9F4] p-4 text-sm text-ceda-body">
          <strong className="text-ceda-ink">What happens next?</strong>
          <p className="mt-1">
            You can save a draft at any time. Once submitted, your application receives a reference number and enters review.
          </p>
        </div>
      </>
    );
  }

  if (stepIndex === 1) {
    return (
      <>
        <div>
          <label htmlFor="categoryId" className="block text-sm font-semibold text-ceda-ink">
            Strategic priority area{" "}
            <span aria-hidden="true" className="text-ceda-burgundy">*</span>
          </label>
          <p id="category-help" className="mt-1 text-sm text-ceda-muted">
            Choose the area that best matches your idea.
          </p>
          <select
            id="categoryId"
            aria-invalid={categoryError ? "true" : "false"}
            aria-describedby={
              categoryError ? "category-help category-error" : "category-help"
            }
            className={SUBMISSION_INPUT_CLASS}
            {...register("categoryId")}
          >
            <option value="">Select a priority area</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage id="category-error" message={categoryError} />
        </div>
        {categories.length === 0 ? (
          <p
            className="rounded-xl border border-amber-700/20 bg-amber-50 p-4 text-sm text-amber-900"
            role="status"
          >
            This opportunity has no priority areas configured yet. Contact CEDA for help.
          </p>
        ) : null}
        <SectionDynamicFields
          sectionKey="general_information"
          fields={fields}
          register={register}
          errors={errors}
          serverFieldErrors={serverFieldErrors}
        />
        {fields.every((field) => field.sectionKey !== "general_information") ? (
          <p className="rounded-xl bg-[#FFF9F4] p-4 text-sm leading-6 text-ceda-muted">
            Add your priority area above. CEDA may request additional applicant details for this opportunity.
          </p>
        ) : null}
      </>
    );
  }

  if (stepIndex === 2) {
    return (
      <>
        <fieldset
          role="radiogroup"
          aria-invalid={statusError ? "true" : "false"}
          aria-describedby={statusError ? "solution-status-error" : undefined}
        >
          <legend className="text-sm font-semibold text-ceda-ink">
            Current solution stage{" "}
            <span aria-hidden="true" className="text-ceda-burgundy">*</span>
          </legend>
          <p className="mt-1 text-sm text-ceda-muted">
            Select the option that best describes your solution today.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SOLUTION_STAGES.map((stage, optionIndex) => (
              <label
                key={stage}
                htmlFor={`solution-stage-${optionIndex}`}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line bg-white px-3 text-sm text-ceda-body"
              >
                <input
                  id={`solution-stage-${optionIndex}`}
                  type="radio"
                  value={stage}
                  className="h-5 w-5 accent-ceda-burgundy"
                  {...register("solutionStatus")}
                />
                {stage}
              </label>
            ))}
          </div>
          <FieldErrorMessage id="solution-status-error" message={statusError} />
        </fieldset>
        <SectionDynamicFields
          sectionKey="solution_status"
          fields={fields}
          register={register}
          errors={errors}
          serverFieldErrors={serverFieldErrors}
        />
      </>
    );
  }

  if (stepIndex === 3) {
    return (
      <>
        <div>
          <label htmlFor="summary" className="block text-sm font-semibold text-ceda-ink">
            Solution overview{" "}
            <span aria-hidden="true" className="text-ceda-burgundy">*</span>
          </label>
          <p id="summary-help" className="mt-1 text-sm text-ceda-muted">
            Describe the challenge, who it affects, how your solution works, and the impact you expect (at least 30 characters).
          </p>
          <textarea
            id="summary"
            maxLength={5000}
            rows={9}
            aria-invalid={summaryError ? "true" : "false"}
            aria-describedby={
              summaryError ? "summary-help summary-error" : "summary-help"
            }
            className={SUBMISSION_INPUT_CLASS}
            {...register("summary")}
          />
          <FieldErrorMessage id="summary-error" message={summaryError} />
        </div>
        <SectionDynamicFields
          sectionKey="solution_overview"
          fields={fields}
          register={register}
          errors={errors}
          serverFieldErrors={serverFieldErrors}
        />
      </>
    );
  }

  if (stepIndex === 4) {
    return (
      <>
        <fieldset aria-describedby={innovationError ? "innovation-types-error" : undefined}>
          <legend className="text-sm font-semibold text-ceda-ink">
            Innovation type{" "}
            <span aria-hidden="true" className="text-ceda-burgundy">*</span>
          </legend>
          <p className="mt-1 text-sm text-ceda-muted">Select every type that applies.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {INNOVATION_TYPES.map((type, optionIndex) => (
              <label
                key={type}
                htmlFor={`innovation-type-${optionIndex}`}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line bg-white px-3 text-sm text-ceda-body"
              >
                <input
                  id={`innovation-type-${optionIndex}`}
                  type="checkbox"
                  value={type}
                  aria-invalid={innovationError ? "true" : "false"}
                  className="h-5 w-5 accent-ceda-burgundy"
                  {...register("innovationTypes")}
                />
                {type}
              </label>
            ))}
          </div>
          <FieldErrorMessage id="innovation-types-error" message={innovationError} />
        </fieldset>
        <SectionDynamicFields
          sectionKey="type_of_innovation"
          fields={fields}
          register={register}
          errors={errors}
          serverFieldErrors={serverFieldErrors}
        />
      </>
    );
  }

  if (stepIndex === 5) {
    return (
      <>
        <SectionDynamicFields
          sectionKey="additional_information"
          fields={fields}
          register={register}
          errors={errors}
          serverFieldErrors={serverFieldErrors}
        />
        {fields.every((field) => field.sectionKey !== "additional_information") ? (
          <p className="rounded-xl bg-[#FFF9F4] p-4 text-sm leading-6 text-ceda-muted">
            No additional details are required for this opportunity.
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-[#FFF9F4] p-4 text-sm leading-6 text-ceda-body">
        <FileText aria-hidden="true" className="mb-2 h-5 w-5 text-ceda-burgundy" />
        <strong className="text-ceda-ink">Supporting material</strong>
        <p className="mt-1">
          Upload pitch decks, technical proposals, financials, or prototypes directly below, and add any requested external links. Uploaded files are stored privately and shared only with authorized CEDA reviewers.
        </p>
      </div>
      <AttachmentUploader
        mode="draft"
        ideaId={draftId}
        ensureDraftId={ensureDraftId}
        initialAttachments={initialAttachments}
        onUploadingChange={onUploadingChange}
        onCountChange={onAttachmentCountChange}
      />
      <SectionDynamicFields
        sectionKey="solution_documents"
        fields={fields}
        register={register}
        errors={errors}
        serverFieldErrors={serverFieldErrors}
      />
      <ReadinessChecker
        readiness={readiness}
        onJumpToSection={onJumpToSection}
        variant="full"
      />
    </>
  );
}
