"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo } from "react";
import { useForm, type Path } from "react-hook-form";
import { Download } from "lucide-react";
import {
  addEvaluatorInternalNote,
  submitEvaluation,
  type EvaluationState,
  type InternalNoteState,
} from "@/app/(workspace)/(dashboards)/evaluator/assignments/actions";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
} from "@/lib/attachments";
import {
  createEvaluationSchema,
  privateNoteSchema,
  type EvaluationFormValues,
  type PrivateNoteFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

type Criterion = { id: string; name: string; description: string | null; maxScore: number; weight: string };
type SubmissionField = { key: string; label: string; helpText: string | null; sectionKey: string; position: number };
type SubmissionAttachment = { id: string; fileName: string; mimeType: string | null; fileSize: number | null };
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
  submissionFields: SubmissionField[];
  submissionAttachments: SubmissionAttachment[];
  criteria: Criterion[];
  internalNotes: { id: string; body: string; authorName: string; createdAt: Date }[];
};

const initialState: EvaluationState = {};
const initialNoteState: InternalNoteState = {};
const inputClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";
const sections: Record<string, string> = {
  general_information: "General information",
  solution_status: "Solution status",
  solution_overview: "Solution overview",
  type_of_innovation: "Type of innovation",
  additional_information: "Additional information",
  solution_documents: "Solution documents",
  terms_and_conditions: "Terms and conditions",
};

function AnswerValue({ value }: { value: unknown }) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <>
      {values.map((item, index) => {
        const text =
          typeof item === "boolean" ? (item ? "Yes" : "No") : String(item ?? "—");
        let url: URL | null = null;
        try {
          const parsed = new URL(text);
          if (parsed.protocol === "https:" || parsed.protocol === "http:") url = parsed;
        } catch {
          /* Display as text. */
        }
        return (
          <span key={`${index}-${text}`} className="block">
            {url ? (
              <a
                href={url.href}
                target="_blank"
                rel="noreferrer"
                className="break-all font-semibold text-ceda-burgundy underline underline-offset-2"
              >
                {text}
              </a>
            ) : (
              text
            )}
          </span>
        );
      })}
    </>
  );
}

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
  const [noteState, noteAction, notePending] = useActionState(
    addEvaluatorInternalNote,
    initialNoteState,
  );

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

  const noteForm = useForm<PrivateNoteFormValues>({
    resolver: zodResolver(privateNoteSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { body: "" },
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

  const onNoteSubmit = noteForm.handleSubmit((values) => {
    const formData = new FormData();
    formData.set("assignmentId", assignmentId);
    formData.set("versionId", versionId);
    formData.set("body", values.body);
    startTransition(() => {
      noteAction(formData);
      noteForm.reset();
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
  const noteErrors = noteForm.formState.errors;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ceda-line bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
          {referenceNo} | {stageName} | Version {versionNo}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ceda-ink">{title}</h2>
        {categoryName ? (
          <p className="mt-1 text-sm font-semibold text-ceda-muted">{categoryName}</p>
        ) : null}
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ceda-body">
          {summary}
        </p>
        {Object.keys(answers).length > 0 ? (
          <div className="mt-6 space-y-5">
            {[
              ...new Set([
                ...submissionFields.map(({ sectionKey }) => sectionKey),
                "general_information",
              ]),
            ].map((sectionKey) => {
              const fields = submissionFields.filter(
                (field) => field.sectionKey === sectionKey,
              );
              const rows = fields
                .filter(({ key }) => Object.hasOwn(answers, key))
                .map(({ key, label, helpText }) => ({
                  key,
                  label,
                  helpText,
                  value: answers[key],
                }));
              const builtinKeys =
                sectionKey === "solution_status"
                  ? ["solution_status"]
                  : sectionKey === "type_of_innovation"
                    ? ["innovation_types"]
                    : [];
              for (const key of builtinKeys) {
                if (Object.hasOwn(answers, key) && !rows.some((row) => row.key === key)) {
                  rows.push({
                    key,
                    label:
                      key === "solution_status"
                        ? "Current solution status"
                        : "Innovation type(s)",
                    helpText: null,
                    value: answers[key],
                  });
                }
              }
              for (const [key, value] of Object.entries(answers)) {
                if (
                  !submissionFields.some((field) => field.key === key) &&
                  !["solution_status", "innovation_types"].includes(key) &&
                  sectionKey === "general_information"
                ) {
                  rows.push({
                    key,
                    label: key.replaceAll("_", " "),
                    helpText: null,
                    value,
                  });
                }
              }
              if (!rows.length) return null;
              return (
                <section
                  key={sectionKey}
                  aria-label={sections[sectionKey] ?? sectionKey.replaceAll("_", " ")}
                >
                  <h3 className="border-b border-ceda-line pb-2 text-sm font-bold uppercase tracking-wide text-ceda-burgundy">
                    {sections[sectionKey] ?? sectionKey.replaceAll("_", " ")}
                  </h3>
                  <dl className="divide-y divide-ceda-line">
                    {rows.map((row) => (
                      <div
                        key={row.key}
                        className="grid gap-1 py-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-5"
                      >
                        <dt className="text-sm font-semibold text-ceda-ink">
                          {row.label}
                          {row.helpText ? (
                            <span className="mt-1 block text-xs font-normal leading-5 text-ceda-muted">
                              {row.helpText}
                            </span>
                          ) : null}
                        </dt>
                        <dd className="break-words text-sm leading-6 text-ceda-body">
                          <AnswerValue value={row.value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}
          </div>
        ) : null}
        {submissionAttachments.length > 0 ? (
          <section className="mt-6" aria-labelledby="submission-files-heading">
            <h3 id="submission-files-heading" className="text-sm font-bold text-ceda-ink">
              Supporting files
            </h3>
            <ul className="mt-2 space-y-2">
              {submissionAttachments.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ceda-line bg-[#FFFDFC] px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ceda-ink">
                      {file.fileName}
                    </span>
                    <span className="block text-xs text-ceda-muted">
                      {getAttachmentTypeLabel(file.mimeType, file.fileName)} ·{" "}
                      {formatFileSize(file.fileSize)}
                    </span>
                  </span>
                  <a
                    href={getAttachmentDownloadPath(file.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                  >
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

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

      <section
        aria-labelledby="private-notes-heading"
        className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-6 sm:p-8"
      >
        <h2 id="private-notes-heading" className="text-xl font-bold text-ceda-ink">
          Evaluator-only notes
        </h2>
        <p className="mt-1 text-sm leading-6 text-ceda-muted">
          These notes are tied to this submission version and are hidden from the submitter. Use the adjudication feedback action when requesting a change from the submitter.
        </p>
        {internalNotes.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {internalNotes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-ceda-line bg-white p-4"
              >
                <p className="whitespace-pre-wrap text-sm leading-6 text-ceda-body">
                  {note.body}
                </p>
                <p className="mt-2 text-xs text-ceda-muted">
                  {note.authorName} ·{" "}
                  {new Intl.DateTimeFormat("en-BW", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Africa/Gaborone",
                  }).format(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <FormErrorAnnouncer
          errors={noteErrors}
          submitCount={noteForm.formState.submitCount}
        />

        <form
          noValidate
          onSubmit={onNoteSubmit}
          aria-labelledby="private-note-form-heading"
          className="mt-5 space-y-3"
        >
          <h3 id="private-note-form-heading" className="text-sm font-bold text-ceda-ink">
            Add a private note
          </h3>
          <p id="private-note-help" className="text-xs text-ceda-muted">
            3 to 5,000 characters. Only authorized staff can read this note.
          </p>
          <label htmlFor="evaluator-private-note" className="sr-only">
            Private evaluator note
          </label>
          <textarea
            id="evaluator-private-note"
            maxLength={5000}
            rows={4}
            aria-invalid={noteErrors.body ? "true" : "false"}
            aria-describedby={
              noteErrors.body
                ? "private-note-help private-note-error"
                : "private-note-help"
            }
            className={inputClass}
            {...noteForm.register("body")}
          />
          <FieldErrorMessage
            id="private-note-error"
            message={noteErrors.body?.message}
          />
          {noteState.error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">
              {noteState.error}
            </p>
          ) : null}
          {noteState.success ? (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900" role="status">
              {noteState.success}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={notePending}
            className="inline-flex min-h-12 items-center rounded-full border border-ceda-burgundy px-5 text-sm font-bold text-ceda-burgundy hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            {notePending ? "Saving note…" : "Save private note"}
          </button>
        </form>
      </section>
    </div>
  );
}
