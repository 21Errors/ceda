"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo } from "react";
import { useForm, type Path } from "react-hook-form";
import {
  submitEvaluation,
  type EvaluationState,
} from "@/app/(workspace)/(dashboards)/evaluator/assignments/actions";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  createEvaluationSchema,
  type EvaluationFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import {
  EvaluatorPrivateNotes,
  type InternalNoteItem,
} from "./EvaluatorPrivateNotes";
import {
  SubmissionReviewSummary,
  type ReviewSubmissionAttachment,
  type ReviewSubmissionField,
} from "./SubmissionReviewSummary";

type Criterion = {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: string;
};

type Props = {
  assignmentId: string;
  versionId: string;
  referenceNo: string;
  stageName: string;
  title: string;
  summary: string;
  categoryName: string | null;
  versionNo: number;
  answers: Record<string, unknown>;
  submissionFields: ReviewSubmissionField[];
  submissionAttachments: ReviewSubmissionAttachment[];
  criteria: Criterion[];
  internalNotes: InternalNoteItem[];
};

const initialState: EvaluationState = {};
const inputClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function EvaluationForm({
  assignmentId,
  versionId,
  referenceNo,
  stageName,
  title,
  summary,
  categoryName,
  versionNo,
  answers,
  submissionFields,
  submissionAttachments,
  criteria,
  internalNotes,
}: Props) {
  const [state, action, pending] = useActionState(submitEvaluation, initialState);

  const evaluationSchema = useMemo(
    () => createEvaluationSchema(criteria),
    [criteria],
  );

  const evaluationForm = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      scores: Object.fromEntries(criteria.map((c) => [c.id, ""])),
      comments: Object.fromEntries(criteria.map((c) => [c.id, ""])),
      overallComment: "",
    },
  });

  const onEvaluationSubmit = evaluationForm.handleSubmit((values) => {
    const formData = new FormData();
    formData.set("assignmentId", assignmentId);
    formData.set("versionId", versionId);
    formData.set("overallComment", values.overallComment);
    for (const criterion of criteria) {
      formData.set(`score:${criterion.id}`, values.scores[criterion.id] ?? "");
      formData.set(`comment:${criterion.id}`, values.comments[criterion.id] ?? "");
    }
    startTransition(() => {
      action(formData);
    });
  });

  if (state.totalScore) {
    return (
      <section
        className="rounded-2xl border border-green-800/20 bg-green-50 p-6"
        aria-live="polite"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-900">
          Review submitted
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ceda-ink">
          Weighted score: {state.totalScore} / 100
        </h2>
        <p className="mt-2 text-sm text-ceda-body">
          Your evaluation has been saved against this exact submission version.
        </p>
        <Link
          href="/evaluator"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white"
        >
          Return to evaluator queue
        </Link>
      </section>
    );
  }

  const evalErrors = evaluationForm.formState.errors;

  return (
    <div className="space-y-6">
      <SubmissionReviewSummary
        referenceNo={referenceNo}
        stageName={stageName}
        title={title}
        summary={summary}
        categoryName={categoryName}
        versionNo={versionNo}
        answers={answers}
        submissionFields={submissionFields}
        submissionAttachments={submissionAttachments}
      />

      <FormErrorAnnouncer
        errors={evalErrors}
        submitCount={evaluationForm.formState.submitCount}
      />

      <form
        noValidate
        onSubmit={onEvaluationSubmit}
        aria-labelledby="evaluation-heading"
        className="space-y-5 rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 id="evaluation-heading" className="text-xl font-bold text-ceda-ink">
            Score this submission
          </h2>
          <p className="mt-1 text-sm text-ceda-muted">
            Score each criterion within its range. The combined score is normalized to 100 using the configured weights.
          </p>
        </div>
        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
          >
            {state.error}
          </p>
        ) : null}

        {criteria.map((criterion, index) => {
          const scoreError = evalErrors.scores?.[criterion.id]?.message;
          const commentError = evalErrors.comments?.[criterion.id]?.message;
          return (
            <fieldset key={criterion.id} className="rounded-xl border border-ceda-line p-4 sm:p-5">
              <legend className="px-1 font-bold text-ceda-ink">
                {index + 1}. {criterion.name}
              </legend>
              {criterion.description ? (
                <p className="mt-1 text-sm leading-6 text-ceda-muted">
                  {criterion.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ceda-muted">
                0–{criterion.maxScore} points · weight {criterion.weight}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)]">
                <div>
                  <label
                    htmlFor={`score-${criterion.id}`}
                    className="text-sm font-semibold text-ceda-ink"
                  >
                    Score
                  </label>
                  <input
                    id={`score-${criterion.id}`}
                    type="number"
                    min="0"
                    max={criterion.maxScore}
                    step="any"
                    aria-invalid={scoreError ? "true" : "false"}
                    aria-describedby={
                      scoreError ? `score-error-${criterion.id}` : undefined
                    }
                    className={inputClass}
                    {...evaluationForm.register(
                      `scores.${criterion.id}` as Path<EvaluationFormValues>,
                    )}
                  />
                  <FieldErrorMessage
                    id={`score-error-${criterion.id}`}
                    message={scoreError}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`comment-${criterion.id}`}
                    className="text-sm font-semibold text-ceda-ink"
                  >
                    Criterion feedback
                  </label>
                  <textarea
                    id={`comment-${criterion.id}`}
                    maxLength={2000}
                    rows={2}
                    aria-invalid={commentError ? "true" : "false"}
                    aria-describedby={
                      commentError ? `comment-error-${criterion.id}` : undefined
                    }
                    className={inputClass}
                    {...evaluationForm.register(
                      `comments.${criterion.id}` as Path<EvaluationFormValues>,
                    )}
                  />
                  <FieldErrorMessage
                    id={`comment-error-${criterion.id}`}
                    message={commentError}
                  />
                </div>
              </div>
            </fieldset>
          );
        })}

        <div>
          <label htmlFor="overallComment" className="text-sm font-semibold text-ceda-ink">
            Overall feedback <span className="font-normal text-ceda-muted">(optional)</span>
          </label>
          <textarea
            id="overallComment"
            maxLength={5000}
            rows={4}
            aria-invalid={evalErrors.overallComment ? "true" : "false"}
            aria-describedby={
              evalErrors.overallComment ? "overall-comment-error" : undefined
            }
            className={inputClass}
            {...evaluationForm.register("overallComment")}
          />
          <FieldErrorMessage
            id="overall-comment-error"
            message={evalErrors.overallComment?.message}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Submitting review…" : "Submit evaluation"}
        </button>
      </form>

      <EvaluatorPrivateNotes
        assignmentId={assignmentId}
        versionId={versionId}
        internalNotes={internalNotes}
      />
    </div>
  );
}
