"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  addEvaluationCriterion,
  addFormField,
  addWorkflowStage,
  updateEvaluationCriterion,
  updateWorkflowStage,
} from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import {
  addCriterionSchema,
  addFormFieldSchema,
  addWorkflowStageSchema,
  criterionSchema,
  updateWorkflowStageSchema,
  type AddCriterionFormValues,
  type AddFormFieldValues,
  type AddWorkflowStageValues,
  type CriterionFormValues,
  type UpdateWorkflowStageValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const fieldClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function AddCallFormFieldForm({ callId }: { callId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<AddFormFieldValues>({
    resolver: zodResolver(addFormFieldSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      key: "",
      label: "",
      helpText: "",
      sectionKey: "general_information",
      type: "text",
      options: "",
      required: false,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("key", values.key);
    formData.set("label", values.label);
    formData.set("helpText", values.helpText);
    formData.set("sectionKey", values.sectionKey);
    formData.set("type", values.type);
    formData.set("options", values.options);
    if (values.required) formData.set("required", "on");
    startTransition(async () => {
      await addFormField(formData);
      reset();
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="add-field-heading"
        className="mt-6 space-y-4 rounded-2xl border border-ceda-line bg-[#FFF9F4] p-5 sm:p-6"
      >
        <h3 id="add-field-heading" className="font-bold text-ceda-ink">
          Add a form field
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="key" className="text-sm font-semibold text-ceda-ink">
              Field key
            </label>
            <p id="key-help" className="mt-1 text-xs text-ceda-muted">
              Lowercase letters, numbers, and underscores.
            </p>
            <input
              id="key"
              maxLength={80}
              aria-invalid={errors.key ? "true" : "false"}
              aria-describedby={errors.key ? "key-help key-error" : "key-help"}
              className={fieldClass}
              {...register("key")}
            />
            <FieldErrorMessage id="key-error" message={errors.key?.message} />
          </div>
          <div>
            <label htmlFor="label" className="text-sm font-semibold text-ceda-ink">
              Label
            </label>
            <input
              id="label"
              maxLength={255}
              aria-invalid={errors.label ? "true" : "false"}
              aria-describedby={errors.label ? "label-error" : undefined}
              className={fieldClass}
              {...register("label")}
            />
            <FieldErrorMessage id="label-error" message={errors.label?.message} />
          </div>
        </div>
        <div>
          <label htmlFor="helpText" className="text-sm font-semibold text-ceda-ink">
            Help text
          </label>
          <textarea
            id="helpText"
            maxLength={2000}
            rows={2}
            aria-invalid={errors.helpText ? "true" : "false"}
            aria-describedby={errors.helpText ? "helpText-error" : undefined}
            className={fieldClass}
            {...register("helpText")}
          />
          <FieldErrorMessage id="helpText-error" message={errors.helpText?.message} />
        </div>
        <div>
          <label htmlFor="sectionKey" className="text-sm font-semibold text-ceda-ink">
            Application section
          </label>
          <select id="sectionKey" className={fieldClass} {...register("sectionKey")}>
            <option value="general_information">General Information</option>
            <option value="solution_status">Solution Status</option>
            <option value="solution_overview">Solution Overview</option>
            <option value="type_of_innovation">Type of Innovation</option>
            <option value="additional_information">Additional Information</option>
            <option value="solution_documents">Solution Documents</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="text-sm font-semibold text-ceda-ink">
              Field type
            </label>
            <select id="type" className={fieldClass} {...register("type")}>
              <option value="text">Short text</option>
              <option value="textarea">Long text</option>
              <option value="url">Web address</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Choose one</option>
              <option value="multiselect">Choose multiple</option>
              <option value="checkbox">Confirmation</option>
            </select>
          </div>
          <div>
            <label htmlFor="options" className="text-sm font-semibold text-ceda-ink">
              Choices (for select fields)
            </label>
            <p id="options-help" className="mt-1 text-xs text-ceda-muted">
              Separate choices with commas.
            </p>
            <input
              id="options"
              maxLength={2000}
              aria-invalid={errors.options ? "true" : "false"}
              aria-describedby={
                errors.options ? "options-help options-error" : "options-help"
              }
              className={fieldClass}
              {...register("options")}
            />
            <FieldErrorMessage id="options-error" message={errors.options?.message} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ceda-ink">
          <input
            type="checkbox"
            className="h-5 w-5 accent-ceda-burgundy"
            {...register("required")}
          />
          Required answer
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add field"}
        </button>
      </form>
    </>
  );
}

export function UpdateWorkflowStageForm({
  callId,
  stageId,
  name,
  description,
}: {
  callId: string;
  stageId: string;
  name: string;
  description: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<UpdateWorkflowStageValues>({
    resolver: zodResolver(updateWorkflowStageSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name, description },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("stageId", stageId);
    formData.set("name", values.name);
    formData.set("description", values.description);
    startTransition(async () => {
      await updateWorkflowStage(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-label={`Update ${name}`}
        className="mt-2 space-y-2"
      >
        <div>
          <label htmlFor={`stage-name-${stageId}`} className="sr-only">
            Stage name
          </label>
          <input
            id={`stage-name-${stageId}`}
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={
              errors.name ? `stage-name-error-${stageId}` : undefined
            }
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id={`stage-name-error-${stageId}`}
            message={errors.name?.message}
          />
        </div>
        <div>
          <label htmlFor={`stage-description-${stageId}`} className="sr-only">
            Stage description
          </label>
          <textarea
            id={`stage-description-${stageId}`}
            maxLength={2000}
            rows={2}
            placeholder="Optional stage description"
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? `stage-desc-error-${stageId}` : undefined
            }
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id={`stage-desc-error-${stageId}`}
            message={errors.description?.message}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full border border-ceda-line px-4 text-xs font-bold text-ceda-burgundy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save stage"}
        </button>
      </form>
    </>
  );
}

export function AddWorkflowStageForm({ callId }: { callId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<AddWorkflowStageValues>({
    resolver: zodResolver(addWorkflowStageSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { key: "", name: "", type: "evaluation", description: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("key", values.key);
    formData.set("name", values.name);
    formData.set("type", values.type);
    formData.set("description", values.description);
    startTransition(async () => {
      await addWorkflowStage(formData);
      reset();
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="add-stage-heading"
        className="mt-5 space-y-3 border-t border-ceda-line pt-5"
      >
        <h3 id="add-stage-heading" className="font-bold text-ceda-ink">
          Add a workflow stage
        </h3>
        <div>
          <label htmlFor="stage-key" className="text-sm font-semibold text-ceda-ink">
            Stage key
          </label>
          <input
            id="stage-key"
            maxLength={80}
            aria-invalid={errors.key ? "true" : "false"}
            aria-describedby={errors.key ? "stage-key-error" : undefined}
            className={fieldClass}
            {...register("key")}
          />
          <FieldErrorMessage id="stage-key-error" message={errors.key?.message} />
        </div>
        <div>
          <label htmlFor="stage-name" className="text-sm font-semibold text-ceda-ink">
            Stage name
          </label>
          <input
            id="stage-name"
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "stage-name-error" : undefined}
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage id="stage-name-error" message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="stage-type" className="text-sm font-semibold text-ceda-ink">
            Stage type
          </label>
          <select id="stage-type" className={fieldClass} {...register("type")}>
            <option value="intake">Intake</option>
            <option value="screening">Screening</option>
            <option value="evaluation">Evaluation</option>
            <option value="adjudication">Adjudication</option>
            <option value="feedback">Feedback</option>
            <option value="decision">Decision</option>
            <option value="award">Award</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="stage-new-description"
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <textarea
            id="stage-new-description"
            maxLength={2000}
            rows={2}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={errors.description ? "stage-new-desc-error" : undefined}
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id="stage-new-desc-error"
            message={errors.description?.message}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add stage"}
        </button>
      </form>
    </>
  );
}

export function EditCriterionForm({
  callId,
  criterionId,
  name,
  description,
  maxScore,
  weight,
}: {
  callId: string;
  criterionId: string;
  name: string;
  description: string;
  maxScore: number;
  weight: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name,
      description,
      maxScore: String(maxScore),
      weight,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("criterionId", criterionId);
    formData.set("name", values.name);
    formData.set("description", values.description);
    formData.set("maxScore", values.maxScore);
    formData.set("weight", values.weight);
    startTransition(async () => {
      await updateEvaluationCriterion(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-label={`Edit ${name}`}
        className="space-y-3"
      >
        <div>
          <label
            htmlFor={`criterion-edit-name-${criterionId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Name
          </label>
          <input
            id={`criterion-edit-name-${criterionId}`}
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={
              errors.name ? `criterion-edit-name-error-${criterionId}` : undefined
            }
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id={`criterion-edit-name-error-${criterionId}`}
            message={errors.name?.message}
          />
        </div>
        <div>
          <label
            htmlFor={`criterion-edit-description-${criterionId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <textarea
            id={`criterion-edit-description-${criterionId}`}
            maxLength={2000}
            rows={2}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? `criterion-edit-desc-error-${criterionId}` : undefined
            }
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id={`criterion-edit-desc-error-${criterionId}`}
            message={errors.description?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`criterion-edit-max-${criterionId}`}
              className="text-xs font-semibold text-ceda-ink"
            >
              Maximum score
            </label>
            <input
              id={`criterion-edit-max-${criterionId}`}
              type="number"
              min="1"
              max="1000"
              step="1"
              aria-invalid={errors.maxScore ? "true" : "false"}
              aria-describedby={
                errors.maxScore ? `criterion-edit-max-error-${criterionId}` : undefined
              }
              className={fieldClass}
              {...register("maxScore")}
            />
            <FieldErrorMessage
              id={`criterion-edit-max-error-${criterionId}`}
              message={errors.maxScore?.message}
            />
          </div>
          <div>
            <label
              htmlFor={`criterion-edit-weight-${criterionId}`}
              className="text-xs font-semibold text-ceda-ink"
            >
              Weight
            </label>
            <input
              id={`criterion-edit-weight-${criterionId}`}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              aria-invalid={errors.weight ? "true" : "false"}
              aria-describedby={
                errors.weight ? `criterion-edit-weight-error-${criterionId}` : undefined
              }
              className={fieldClass}
              {...register("weight")}
            />
            <FieldErrorMessage
              id={`criterion-edit-weight-error-${criterionId}`}
              message={errors.weight?.message}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full border border-ceda-line px-4 text-sm font-bold text-ceda-burgundy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save criterion"}
        </button>
      </form>
    </>
  );
}

export function AddCriterionForm({
  callId,
  evaluationStages,
}: {
  callId: string;
  evaluationStages: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<AddCriterionFormValues>({
    resolver: zodResolver(addCriterionSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      stageId: "",
      name: "",
      description: "",
      maxScore: "10",
      weight: "1",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("stageId", values.stageId);
    formData.set("name", values.name);
    formData.set("description", values.description);
    formData.set("maxScore", values.maxScore);
    formData.set("weight", values.weight);
    startTransition(async () => {
      await addEvaluationCriterion(formData);
      reset();
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="add-criterion-heading"
        className="mt-5 space-y-3 border-t border-ceda-line pt-5"
      >
        <h3 id="add-criterion-heading" className="font-bold text-ceda-ink">
          Add a criterion
        </h3>
        <div>
          <label htmlFor="stageId" className="text-sm font-semibold text-ceda-ink">
            Evaluation stage
          </label>
          <select
            id="stageId"
            aria-invalid={errors.stageId ? "true" : "false"}
            aria-describedby={errors.stageId ? "criterion-stage-error" : undefined}
            className={fieldClass}
            {...register("stageId")}
          >
            <option value="" disabled>
              Select a stage
            </option>
            {evaluationStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage
            id="criterion-stage-error"
            message={errors.stageId?.message}
          />
        </div>
        <div>
          <label
            htmlFor="criterionName"
            className="text-sm font-semibold text-ceda-ink"
          >
            Criterion
          </label>
          <input
            id="criterionName"
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "criterion-name-error" : undefined}
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id="criterion-name-error"
            message={errors.name?.message}
          />
        </div>
        <div>
          <label
            htmlFor="criterionDescription"
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <textarea
            id="criterionDescription"
            maxLength={2000}
            rows={2}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? "criterion-desc-error" : undefined
            }
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id="criterion-desc-error"
            message={errors.description?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="maxScore" className="text-xs font-semibold text-ceda-ink">
              Maximum score
            </label>
            <input
              id="maxScore"
              type="number"
              min="1"
              max="1000"
              step="1"
              aria-invalid={errors.maxScore ? "true" : "false"}
              aria-describedby={
                errors.maxScore ? "criterion-max-error" : undefined
              }
              className={fieldClass}
              {...register("maxScore")}
            />
            <FieldErrorMessage
              id="criterion-max-error"
              message={errors.maxScore?.message}
            />
          </div>
          <div>
            <label htmlFor="weight" className="text-xs font-semibold text-ceda-ink">
              Weight
            </label>
            <input
              id="weight"
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              aria-invalid={errors.weight ? "true" : "false"}
              aria-describedby={errors.weight ? "criterion-weight-error" : undefined}
              className={fieldClass}
              {...register("weight")}
            />
            <FieldErrorMessage
              id="criterion-weight-error"
              message={errors.weight?.message}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add criterion"}
        </button>
      </form>
    </>
  );
}
