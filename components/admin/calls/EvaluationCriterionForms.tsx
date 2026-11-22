"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  addEvaluationCriterion,
  updateEvaluationCriterion,
} from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import {
  addCriterionSchema,
  criterionSchema,
  type AddCriterionFormValues,
  type CriterionFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { CALL_CONFIG_FIELD_CLASS } from "./styles";

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
            className={CALL_CONFIG_FIELD_CLASS}
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
            className={CALL_CONFIG_FIELD_CLASS}
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
              className={CALL_CONFIG_FIELD_CLASS}
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
              className={CALL_CONFIG_FIELD_CLASS}
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
    control,
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
        className="space-y-4"
      >
        <h3 id="add-criterion-heading" className="text-base font-bold text-ceda-ink">
          Add a criterion
        </h3>
        <div>
          <span className="text-sm font-semibold text-ceda-ink">
            Evaluation stage
            <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
              *
            </span>
          </span>
          <div className="mt-1.5">
            <Controller
              control={control}
              name="stageId"
              render={({ field }) => (
                <SelectDropdown
                  groupLabel="Evaluation stage"
                  value={field.value}
                  placeholder="Select a stage"
                  invalid={Boolean(errors.stageId)}
                  options={evaluationStages.map((stage) => ({
                    value: stage.id,
                    label: stage.name,
                  }))}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
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
            className={CALL_CONFIG_FIELD_CLASS}
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
            className={CALL_CONFIG_FIELD_CLASS}
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
              className={CALL_CONFIG_FIELD_CLASS}
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
              className={CALL_CONFIG_FIELD_CLASS}
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
