"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  addWorkflowStage,
  updateWorkflowStage,
} from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import {
  addWorkflowStageSchema,
  updateWorkflowStageSchema,
  type AddWorkflowStageValues,
  type UpdateWorkflowStageValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { CALL_CONFIG_FIELD_CLASS } from "./styles";

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
            className={CALL_CONFIG_FIELD_CLASS}
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
            className={CALL_CONFIG_FIELD_CLASS}
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

const STAGE_TYPE_OPTIONS = [
  { value: "intake", label: "Intake" },
  { value: "screening", label: "Screening" },
  { value: "evaluation", label: "Evaluation" },
  { value: "adjudication", label: "Adjudication" },
  { value: "feedback", label: "Feedback" },
  { value: "decision", label: "Decision" },
  { value: "award", label: "Award" },
] as const;

export function AddWorkflowStageForm({ callId }: { callId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
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
        className="space-y-4"
      >
        <h3 id="add-stage-heading" className="text-base font-bold text-ceda-ink">
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
            className={CALL_CONFIG_FIELD_CLASS}
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
            className={CALL_CONFIG_FIELD_CLASS}
            {...register("name")}
          />
          <FieldErrorMessage id="stage-name-error" message={errors.name?.message} />
        </div>
        <div>
          <span className="text-sm font-semibold text-ceda-ink">
            Stage type
            <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
              *
            </span>
          </span>
          <div className="mt-1.5">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <SelectDropdown
                  groupLabel="Stage type"
                  value={field.value}
                  options={STAGE_TYPE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
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
            className={CALL_CONFIG_FIELD_CLASS}
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
