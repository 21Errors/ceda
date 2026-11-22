"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import {
  addEvaluatorInternalNote,
  type InternalNoteState,
} from "@/app/(workspace)/(dashboards)/evaluator/assignments/actions";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  privateNoteSchema,
  type PrivateNoteFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const initialNoteState: InternalNoteState = {};
const inputClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export interface InternalNoteItem {
  id: string;
  body: string;
  authorName: string;
  createdAt: Date;
}

export function EvaluatorPrivateNotes({
  assignmentId,
  versionId,
  internalNotes,
}: {
  assignmentId: string;
  versionId: string;
  internalNotes: InternalNoteItem[];
}) {
  const [noteState, noteAction, notePending] = useActionState(
    addEvaluatorInternalNote,
    initialNoteState,
  );

  const noteForm = useForm<PrivateNoteFormValues>({
    resolver: zodResolver(privateNoteSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { body: "" },
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

  const noteErrors = noteForm.formState.errors;

  return (
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
  );
}
