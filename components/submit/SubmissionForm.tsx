"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type Path, type UseFormRegister } from "react-hook-form";
import { Check, ChevronLeft, ChevronRight, CircleCheck, FileText, Save } from "lucide-react";
import { saveSubmissionDraft, submitIdeaAction, type SubmissionState } from "@/app/(submissions)/submit/actions";
import { AttachmentUploader } from "@/components/submit/AttachmentUploader";
import { ReadinessChecker } from "@/components/submit/ReadinessChecker";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import type { AttachmentSummary } from "@/lib/attachments";
import { evaluateIdeaReadiness } from "@/lib/idea-readiness";
import {
  createSubmissionSchema,
  type SubmissionFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

type Field = {
  key: string;
  label: string;
  helpText: string | null;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "date" | "url";
  required: boolean;
  options: string[] | null;
  sectionKey: string;
};

type Draft = {
  id: string;
  categoryId: string | null;
  title: string;
  summary: string;
  answers: Record<string, unknown>;
  termsAccepted: boolean;
} | null;

type Props = {
  call: { id: string; title: string; description: string | null; closesAt: string | null };
  fields: Field[];
  categories: { id: string; name: string; description: string | null }[];
  initialDraft: Draft;
  initialAttachments: AttachmentSummary[];
};

const sections = [
  { key: "terms_and_conditions", label: "Terms and Conditions", description: "Name your idea and confirm the terms." },
  { key: "general_information", label: "General Information", description: "Tell us who is applying and where the idea fits." },
  { key: "solution_status", label: "Solution Status", description: "Show how far your solution has progressed." },
  { key: "solution_overview", label: "Solution Overview", description: "Explain the problem and your proposed solution." },
  { key: "type_of_innovation", label: "Type of Innovation", description: "Select the kind of innovation you are proposing." },
  { key: "additional_information", label: "Additional Information", description: "Add the remaining details requested for this opportunity." },
  { key: "solution_documents", label: "Solution Documents", description: "Upload pitch decks and supporting documents, or add prototype links." },
] as const;

const solutionStages = [
  "Idea or concept",
  "Prototype in development",
  "Pilot or testing",
  "Ready to launch",
  "Already operating",
];

const innovationTypes = [
  "Product",
  "Service",
  "Process",
  "Technology",
  "Business model",
  "Social innovation",
];

const inputClass =
  "ds-field-control mt-2 block min-h-12 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

function printValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function buildDefaultAnswers(fields: Field[], answerValues: Record<string, unknown>) {
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

function FieldControl({
  field,
  register,
  error,
}: {
  field: Field;
  register: UseFormRegister<SubmissionFormValues>;
  error?: string;
}) {
  const id = `answer-${field.key}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [field.helpText ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const fieldPath = `answers.${field.key}` as Path<SubmissionFormValues>;
  const registration = register(fieldPath);

  if (field.type === "checkbox") {
    return (
      <div>
        <label
          htmlFor={id}
          className="flex min-h-12 items-start gap-3 text-sm leading-6 text-ceda-body"
        >
          <input
            id={id}
            type="checkbox"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : "false"}
            className="mt-1 h-5 w-5 accent-ceda-burgundy"
            {...registration}
          />
          <span className="font-semibold text-ceda-ink">
            {field.label}
            {field.required ? (
              <span aria-hidden="true" className="text-ceda-burgundy">
                {" "}
                *
              </span>
            ) : null}
          </span>
        </label>
        {field.helpText ? (
          <p id={hintId} className="mt-1 text-sm text-ceda-muted">
            {field.helpText}
          </p>
        ) : null}
        <FieldErrorMessage id={errorId} message={error} />
      </div>
    );
  }

  if (field.type === "multiselect") {
    return (
      <fieldset aria-describedby={describedBy}>
        <legend className="text-sm font-semibold text-ceda-ink">
          {field.label}
          {field.required ? (
            <span aria-hidden="true" className="text-ceda-burgundy">
              {" "}
              *
            </span>
          ) : null}
        </legend>
        {field.helpText ? (
          <p id={hintId} className="mt-1 text-sm text-ceda-muted">
            {field.helpText}
          </p>
        ) : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((option, index) => (
            <label
              key={option}
              htmlFor={`${id}-${index}`}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line bg-white px-3 text-sm text-ceda-body"
            >
              <input
                id={`${id}-${index}`}
                type="checkbox"
                value={option}
                aria-invalid={error ? "true" : "false"}
                className="h-5 w-5 accent-ceda-burgundy"
                {...registration}
              />
              {option}
            </label>
          ))}
        </div>
        <FieldErrorMessage id={errorId} message={error} />
      </fieldset>
    );
  }

  const common = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": (error ? "true" : "false") as "true" | "false",
    className: inputClass,
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ceda-ink">
        {field.label}
        {field.required ? (
          <span aria-hidden="true" className="text-ceda-burgundy">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {field.helpText ? (
        <p id={hintId} className="mt-1 text-sm text-ceda-muted">
          {field.helpText}
        </p>
      ) : null}
      {field.type === "textarea" ? (
        <textarea {...common} rows={5} maxLength={5000} {...registration} />
      ) : null}
      {field.type === "select" ? (
        <select {...common} {...registration}>
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "number" ? (
        <input {...common} type="number" step="any" {...registration} />
      ) : null}
      {field.type === "date" ? <input {...common} type="date" {...registration} /> : null}
      {field.type === "url" ? (
        <input
          {...common}
          type="url"
          inputMode="url"
          maxLength={4000}
          placeholder="https://"
          {...registration}
        />
      ) : null}
      {field.type === "text" ? (
        <input {...common} type="text" maxLength={4000} {...registration} />
      ) : null}
      <FieldErrorMessage id={errorId} message={error} />
    </div>
  );
}

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
  const [attachmentCount, setAttachmentCount] = useState(
    initialAttachments.length,
  );
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

  function buildFormData(values: SubmissionFormValues): FormData {
    const formData = new FormData();
    formData.set("callId", call.id);
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

  function getSectionFieldPaths(sectionIndex: number): Path<SubmissionFormValues>[] {
    const sectionKey = sections[sectionIndex]?.key;
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
    const result = await saveSubmissionDraft(buildFormData(getValues()));
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

  async function saveDraft() {
    return Boolean(await saveDraftAndGetId());
  }

  async function ensureDraftId(): Promise<string | null> {
    if (draftId) return draftId;
    return saveDraftAndGetId();
  }

  async function continueToNext() {
    const paths = getSectionFieldPaths(active);
    const valid = paths.length > 0 ? await trigger(paths, { shouldFocus: true }) : true;
    if (!valid) return;

    startTransition(async () => {
      const saved = await saveDraft();
      if (saved) goToSection(Math.min(active + 1, sections.length - 1));
    });
  }

  async function saveAndExit() {
    startTransition(async () => {
      const saved = await saveDraft();
      if (saved) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function findFirstErrorSection(formErrors: typeof errors): number {
    if (formErrors.title || formErrors.termsAccepted) return 0;
    if (formErrors.categoryId) return 1;
    if (formErrors.solutionStatus) return 2;
    if (formErrors.summary) return 3;
    if (formErrors.innovationTypes) return 4;
    if (formErrors.answers) {
      for (const field of fields) {
        if (formErrors.answers[field.key]) {
          const sectionIndex = sections.findIndex((s) => s.key === field.sectionKey);
          if (sectionIndex >= 0) return sectionIndex;
        }
      }
    }
    return 0;
  }

  function submitValidApplication(values: SubmissionFormValues) {
    setState({});
    startTransition(async () => {
      const result = await submitIdeaAction(buildFormData(values));
      setState(result);
      if (result.error && result.fieldErrors) {
        const key = Object.keys(result.fieldErrors)[0];
        const sectionKey =
          key === "categoryId"
            ? "general_information"
            : key === "solutionStatus"
              ? "solution_status"
              : key === "summary"
                ? "solution_overview"
                : key === "innovationTypes"
                  ? "type_of_innovation"
                  : key === "termsAccepted" || key === "title"
                    ? "terms_and_conditions"
                    : fields.find((field) => field.key === key)?.sectionKey;
        const sectionIndex = sections.findIndex((section) => section.key === sectionKey);
        if (sectionIndex >= 0) goToSection(sectionIndex);
      }
    });
  }

  function handleInvalidSubmission(formErrors: typeof errors) {
    const targetIndex = findFirstErrorSection(formErrors);
    if (targetIndex !== active) {
      goToSection(targetIndex);
    }
  }

  if (state.referenceNo) {
    return (
      <section
        className="rounded-3xl border border-green-800/20 bg-white p-8 shadow-sm sm:p-12"
        aria-live="polite"
      >
        <CircleCheck aria-hidden="true" className="h-12 w-12 text-green-700" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-green-800">
          Application received
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ceda-ink">
          Your reference is {state.referenceNo}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ceda-muted">
          Your innovation submission is now in the review process. You can follow updates from your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
        >
          Open my dashboard
        </Link>
      </section>
    );
  }

  const titleError = errors.title?.message ?? state.fieldErrors?.title;
  const termsError = errors.termsAccepted?.message ?? state.fieldErrors?.termsAccepted;
  const categoryError = errors.categoryId?.message ?? state.fieldErrors?.categoryId;
  const statusError = errors.solutionStatus?.message ?? state.fieldErrors?.solutionStatus;
  const summaryError = errors.summary?.message ?? state.fieldErrors?.summary;
  const innovationError =
    errors.innovationTypes?.message ?? state.fieldErrors?.innovationTypes;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 rounded-3xl border border-ceda-line bg-white shadow-[0_12px_36px_rgba(77,31,18,0.06)]">
        <header className="border-b border-slate-100 px-5 py-6 sm:px-10 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
            Innovation submission
          </p>
          <h2 id="submission-step-title" className="mt-2 text-2xl font-bold text-ceda-ink sm:text-3xl">
            {sections[active].label}
          </h2>
          <p className="mt-2 text-sm text-ceda-muted">{sections[active].description}</p>
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

          {sections.map((section, index) => (
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
                {index === 0 ? (
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
                        aria-describedby={
                          titleError ? "title-help title-error" : "title-help"
                        }
                        className={inputClass}
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
                ) : null}

                {index === 1 ? (
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
                        className={inputClass}
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
                    {fields
                      .filter((field) => field.sectionKey === "general_information")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                    {fields.every((field) => field.sectionKey !== "general_information") ? (
                      <p className="rounded-xl bg-[#FFF9F4] p-4 text-sm leading-6 text-ceda-muted">
                        Add your priority area above. CEDA may request additional applicant details for this opportunity.
                      </p>
                    ) : null}
                  </>
                ) : null}

                {index === 2 ? (
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
                        {solutionStages.map((stage, optionIndex) => (
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
                    {fields
                      .filter((field) => field.sectionKey === "solution_status")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                  </>
                ) : null}

                {index === 3 ? (
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
                        className={inputClass}
                        {...register("summary")}
                      />
                      <FieldErrorMessage id="summary-error" message={summaryError} />
                    </div>
                    {fields
                      .filter((field) => field.sectionKey === "solution_overview")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                  </>
                ) : null}

                {index === 4 ? (
                  <>
                    <fieldset aria-describedby={innovationError ? "innovation-types-error" : undefined}>
                      <legend className="text-sm font-semibold text-ceda-ink">
                        Innovation type{" "}
                        <span aria-hidden="true" className="text-ceda-burgundy">*</span>
                      </legend>
                      <p className="mt-1 text-sm text-ceda-muted">
                        Select every type that applies.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {innovationTypes.map((type, optionIndex) => (
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
                    {fields
                      .filter((field) => field.sectionKey === "type_of_innovation")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                  </>
                ) : null}

                {index === 5 ? (
                  <>
                    {fields
                      .filter((field) => field.sectionKey === "additional_information")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                    {fields.every((field) => field.sectionKey !== "additional_information") ? (
                      <p className="rounded-xl bg-[#FFF9F4] p-4 text-sm leading-6 text-ceda-muted">
                        No additional details are required for this opportunity.
                      </p>
                    ) : null}
                  </>
                ) : null}

                {index === 6 ? (
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
                      onUploadingChange={setUploadingAttachments}
                      onCountChange={setAttachmentCount}
                    />
                    {fields
                      .filter((field) => field.sectionKey === "solution_documents")
                      .map((field) => (
                        <FieldControl
                          key={field.key}
                          field={field}
                          register={register}
                          error={
                            errors.answers?.[field.key]?.message ??
                            state.fieldErrors?.[field.key]
                          }
                        />
                      ))}
                    <ReadinessChecker
                      readiness={readiness}
                      onJumpToSection={goToSection}
                      variant="full"
                    />
                  </>
                ) : null}
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
              {active < sections.length - 1 ? (
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

      <aside
        className="rounded-3xl border border-ceda-line bg-white p-4 shadow-sm lg:sticky lg:top-24"
        aria-label="Application progress"
      >
        <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
          Sections
        </p>
        <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
          {sections.map((section, index) => (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => goToSection(index)}
                aria-current={active === index ? "step" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                  active === index
                    ? "bg-[#FFF1E4] font-semibold text-ceda-burgundy"
                    : "text-ceda-muted hover:bg-surface-muted hover:text-ceda-ink"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active === index
                      ? "bg-ceda-burgundy text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {index < active ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0 truncate">{section.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label htmlFor="application-progress" className="text-xs font-semibold text-ceda-muted">
            Progress: section {active + 1} of {sections.length}
          </label>
          <progress
            id="application-progress"
            max={sections.length}
            value={active + 1}
            className="mt-2 block h-2 w-full accent-ceda-burgundy"
          >
            {active + 1} of {sections.length}
          </progress>
        </div>
        <ReadinessChecker
          readiness={readiness}
          onJumpToSection={goToSection}
          variant="sidebar"
        />
      </aside>
    </div>
  );
}
