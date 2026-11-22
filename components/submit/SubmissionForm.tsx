"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Check, ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  saveSubmissionDraft,
  submitIdeaAction,
  type SubmissionState,
} from "@/app/(submissions)/submit/actions";
import { FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import type { AttachmentSummary } from "@/lib/attachments";
import { evaluateIdeaReadiness } from "@/lib/idea-readiness";
import {
  createSubmissionSchema,
  type SubmissionFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import {
  buildDefaultAnswers,
  buildSubmissionFormData,
  findFirstErrorSection,
  findSectionForServerFieldError,
  getSectionFieldPaths,
  SUBMISSION_SECTIONS,
  type SubmissionDraft,
  type SubmissionField,
} from "./submission-config";
import { SubmissionProgressSidebar } from "./SubmissionProgressSidebar";
import { SubmissionStepFields } from "./SubmissionStepFields";
import { SubmissionSuccessCard } from "./SubmissionSuccessCard";

type Props = {
  call: { id: string; title: string; description: string | null; closesAt: string | null };
  fields: SubmissionField[];
  categories: { id: string; name: string; description: string | null }[];
  initialDraft: SubmissionDraft;
  initialAttachments: AttachmentSummary[];
};

export function SubmissionForm({
  call,
  fields,
  categories,
  initialDraft,
  initialAttachments,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [draftId, setDraftId] = useState(initialDraft?.id ?? "");
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(initialAttachments.length);
  const [savedMessage, setSavedMessage] = useState("");
  const [state, setState] = useState<SubmissionState>({});
  const [pending, startTransition] = useTransition();

  const answerValues = initialDraft?.answers ?? {};
  const schema = useMemo(() => createSubmissionSchema(fields), [fields]);

  const {
    control,
    register,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title:
        initialDraft?.title === "Untitled submission"
          ? ""
          : initialDraft?.title ?? "",
      termsAccepted: Boolean(initialDraft?.termsAccepted),
      categoryId: initialDraft?.categoryId ?? "",
      solutionStatus:
        typeof answerValues.solution_status === "string"
          ? answerValues.solution_status
          : "",
      summary: initialDraft?.summary ?? "",
      innovationTypes: Array.isArray(answerValues.innovation_types)
        ? answerValues.innovation_types.map(String)
        : [],
      answers: buildDefaultAnswers(fields, answerValues),
    },
  });

  const watchedValues = useWatch({ control });
  const readiness = useMemo(
    () =>
      evaluateIdeaReadiness({
        title: watchedValues.title ?? "",
        summary: watchedValues.summary ?? "",
        categoryId: watchedValues.categoryId ?? "",
        solutionStatus: watchedValues.solutionStatus ?? "",
        innovationTypes: watchedValues.innovationTypes ?? [],
        termsAccepted: Boolean(watchedValues.termsAccepted),
        answers: watchedValues.answers ?? {},
        fields,
        attachmentCount,
      }),
    [watchedValues, fields, attachmentCount],
  );

  function goToSection(index: number) {
    setActive(index);
    requestAnimationFrame(() => {
      const heading = sectionRefs.current[index]?.querySelector<HTMLElement>(
        "[data-step-heading]",
      );
      heading?.focus();
    });
  }

  async function saveDraftAndGetId(): Promise<string | null> {
    setSavedMessage("Saving your application…");
    const result = await saveSubmissionDraft(
      buildSubmissionFormData(call.id, draftId, fields, getValues()),
    );
    if (result.error || !result.draftId) {
      setSavedMessage("");
      setState(result);
      return null;
    }
    setDraftId(result.draftId);
    setState({});
    setSavedMessage("Draft saved");
    return result.draftId;
  }

  async function ensureDraftId(): Promise<string | null> {
    if (draftId) return draftId;
    return saveDraftAndGetId();
  }

  async function continueToNext() {
    const paths = getSectionFieldPaths(active, fields);
    const valid = paths.length > 0 ? await trigger(paths, { shouldFocus: true }) : true;
    if (!valid) return;

    startTransition(async () => {
      const saved = Boolean(await saveDraftAndGetId());
      if (saved) goToSection(Math.min(active + 1, SUBMISSION_SECTIONS.length - 1));
    });
  }

  async function saveAndExit() {
    startTransition(async () => {
      const saved = Boolean(await saveDraftAndGetId());
      if (saved) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function submitValidApplication(values: SubmissionFormValues) {
    setState({});
    startTransition(async () => {
      const result = await submitIdeaAction(
        buildSubmissionFormData(call.id, draftId, fields, values),
      );
      setState(result);
      if (result.error && result.fieldErrors) {
        const firstKey = Object.keys(result.fieldErrors)[0];
        const sectionIndex = findSectionForServerFieldError(firstKey, fields);
        if (sectionIndex >= 0) goToSection(sectionIndex);
      }
    });
  }

  function handleInvalidSubmission(formErrors: typeof errors) {
    const targetIndex = findFirstErrorSection(formErrors, fields);
    if (targetIndex !== active) {
      goToSection(targetIndex);
    }
  }

  if (state.referenceNo) {
    return <SubmissionSuccessCard referenceNo={state.referenceNo} />;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 rounded-3xl border border-ceda-line bg-white shadow-[0_12px_36px_rgba(77,31,18,0.06)]">
        <header className="border-b border-slate-100 px-5 py-6 sm:px-10 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
            Innovation submission
          </p>
          <h2 id="submission-step-title" className="mt-2 text-2xl font-bold text-ceda-ink sm:text-3xl">
            {SUBMISSION_SECTIONS[active].label}
          </h2>
          <p className="mt-2 text-sm text-ceda-muted">{SUBMISSION_SECTIONS[active].description}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ceda-ink">{call.title}</span>
            {call.closesAt ? (
              <span className="text-ceda-muted">
                Closes{" "}
                {new Date(call.closesAt).toLocaleDateString("en-BW", {
                  dateStyle: "medium",
                  timeZone: "Africa/Gaborone",
                })}
              </span>
            ) : null}
          </div>
        </header>

        <FormErrorAnnouncer errors={errors} submitCount={submitCount} />

        <form
          ref={formRef}
          noValidate
          aria-labelledby="submission-step-title"
          onSubmit={(event) => {
            void handleSubmit(submitValidApplication, handleInvalidSubmission)(event);
          }}
        >
          {state.error ? (
            <p
              className="mx-5 mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900 sm:mx-10"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          {SUBMISSION_SECTIONS.map((section, index) => (
            <section
              key={section.key}
              ref={(element) => {
                sectionRefs.current[index] = element;
              }}
              hidden={active !== index}
              aria-labelledby={`step-heading-${section.key}`}
              className="min-h-[330px] px-5 py-6 sm:px-10 sm:py-8"
            >
              <h3 id={`step-heading-${section.key}`} data-step-heading tabIndex={-1} className="sr-only">
                {section.label}
              </h3>
              <div className="space-y-6">
                <SubmissionStepFields
                  stepIndex={index}
                  fields={fields}
                  categories={categories}
                  register={register}
                  errors={errors}
                  serverFieldErrors={state.fieldErrors}
                  draftId={draftId}
                  ensureDraftId={ensureDraftId}
                  initialAttachments={initialAttachments}
                  onUploadingChange={setUploadingAttachments}
                  onAttachmentCountChange={setAttachmentCount}
                  readiness={readiness}
                  onJumpToSection={goToSection}
                />
              </div>
            </section>
          ))}

          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-10">
            <button
              type="button"
              onClick={() => goToSection(Math.max(0, active - 1))}
              disabled={active === 0 || pending || uploadingAttachments}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ceda-line px-5 text-sm font-semibold text-ceda-body hover:bg-[#FFF9F4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </button>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={saveAndExit}
                disabled={pending || uploadingAttachments}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-ceda-muted hover:bg-surface-muted disabled:opacity-50"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                Save &amp; Exit
              </button>
              {active < SUBMISSION_SECTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={continueToNext}
                  disabled={pending || uploadingAttachments}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ceda-burgundy px-7 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
                >
                  Continue <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={pending || uploadingAttachments || categories.length === 0}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ceda-burgundy px-7 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
                >
                  {pending
                    ? "Submitting…"
                    : uploadingAttachments
                      ? "Waiting for upload…"
                      : "Submit application"}
                  <Check aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className="text-center text-xs text-ceda-muted sm:min-w-24" role="status">
              {pending ? "Saving…" : uploadingAttachments ? "Uploading…" : savedMessage}
            </span>
          </footer>
        </form>
      </div>

      <SubmissionProgressSidebar
        active={active}
        onSelectSection={goToSection}
        readiness={readiness}
      />
    </div>
  );
}
