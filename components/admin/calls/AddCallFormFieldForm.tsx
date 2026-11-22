"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { RotateCcw } from "lucide-react";
import { addFormField } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { addFormFieldSchema, type AddFormFieldValues } from "@/lib/form-schemas";
import { sanitizeFieldKeyInput, toFieldKey } from "@/lib/slugify";
import { zodResolver } from "@/lib/zod-resolver";
import { CALL_CONFIG_FIELD_CLASS } from "./styles";

const SECTION_OPTIONS = [
  { value: "general_information", label: "General Information" },
  { value: "solution_status", label: "Solution Status" },
  { value: "solution_overview", label: "Solution Overview" },
  { value: "type_of_innovation", label: "Type of Innovation" },
  { value: "additional_information", label: "Additional Information" },
  { value: "solution_documents", label: "Solution Documents" },
] as const;

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "url", label: "Web address" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Choose one" },
  { value: "multiselect", label: "Choose multiple" },
  { value: "checkbox", label: "Confirmation" },
] as const;

export function AddCallFormFieldForm({ callId }: { callId: string }) {
  const [pending, startTransition] = useTransition();
  const [isKeyManual, setIsKeyManual] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
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

  const selectedType = useWatch({ control, name: "type" });
  const needsChoices =
    selectedType === "select" || selectedType === "multiselect";

  const labelField = register("label");
  const keyField = register("key");

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("callId", callId);
    formData.set("key", toFieldKey(values.key));
    formData.set("label", values.label);
    formData.set("helpText", values.helpText);
    formData.set("sectionKey", values.sectionKey);
    formData.set("type", values.type);
    formData.set("options", needsChoices ? values.options : "");
    if (values.required) formData.set("required", "on");
    startTransition(async () => {
      await addFormField(formData);
      reset();
      setIsKeyManual(false);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="add-field-heading"
        className="space-y-4"
      >
        <div className="border-b border-ceda-line pb-3">
          <h3
            id="add-field-heading"
            className="text-base font-bold text-ceda-ink"
          >
            Add a form field
          </h3>
          <p className="mt-1 text-xs text-ceda-muted">
            Fields marked{" "}
            <span className="font-bold text-ceda-burgundy" aria-hidden="true">
              *
            </span>{" "}
            are required.
          </p>
        </div>

        {/* Question label */}
        <div>
          <label
            htmlFor="field-label"
            className="text-sm font-semibold text-ceda-ink"
          >
            Question label
            <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="field-label"
            required
            maxLength={255}
            placeholder="e.g. Target market or funding needed"
            aria-invalid={errors.label ? "true" : "false"}
            aria-describedby={errors.label ? "label-error" : undefined}
            className={CALL_CONFIG_FIELD_CLASS}
            {...labelField}
            onChange={(event) => {
              labelField.onChange(event);
              if (!isKeyManual) {
                setValue("key", toFieldKey(event.target.value), {
                  shouldValidate: submitCount > 0,
                  shouldDirty: true,
                });
              }
            }}
          />
          <FieldErrorMessage
            id="label-error"
            message={errors.label?.message}
          />
        </div>

        {/* Field key (auto-filled from label) */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="field-key"
              className="text-sm font-semibold text-ceda-ink"
            >
              Field key
              <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
                *
              </span>
            </label>
            {isKeyManual ? (
              <button
                type="button"
                onClick={() => {
                  setIsKeyManual(false);
                  setValue("key", toFieldKey(getValues("label")), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream"
              >
                <RotateCcw aria-hidden="true" className="h-3 w-3" />
                <span>Match label</span>
              </button>
            ) : (
              <span className="text-xs text-ceda-muted">
                Auto-filled from label
              </span>
            )}
          </div>
          <p id="key-help" className="mt-1 text-xs text-ceda-muted">
            Lowercase letters, numbers, and underscores only.
          </p>
          <input
            id="field-key"
            required
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={80}
            placeholder="target_market"
            aria-invalid={errors.key ? "true" : "false"}
            aria-describedby={errors.key ? "key-help key-error" : "key-help"}
            className={CALL_CONFIG_FIELD_CLASS}
            {...keyField}
            onChange={(event) => {
              const raw = event.target.value;
              const cleaned = sanitizeFieldKeyInput(raw);
              if (cleaned !== raw) {
                event.target.value = cleaned;
              }
              setIsKeyManual(cleaned.length > 0);
              keyField.onChange(event);
            }}
            onBlur={(event) => {
              const normalized = toFieldKey(event.target.value);
              if (normalized !== event.target.value) {
                setValue("key", normalized, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              keyField.onBlur(event);
            }}
          />
          <FieldErrorMessage id="key-error" message={errors.key?.message} />
        </div>

        {/* Help text */}
        <div>
          <label
            htmlFor="field-helpText"
            className="text-sm font-semibold text-ceda-ink"
          >
            Help text
          </label>
          <textarea
            id="field-helpText"
            maxLength={2000}
            rows={2}
            placeholder="Optional short tip to guide applicants."
            aria-invalid={errors.helpText ? "true" : "false"}
            aria-describedby={errors.helpText ? "helpText-error" : undefined}
            className={`${CALL_CONFIG_FIELD_CLASS} min-h-20 resize-y`}
            {...register("helpText")}
          />
          <FieldErrorMessage
            id="helpText-error"
            message={errors.helpText?.message}
          />
        </div>

        {/* Application section */}
        <div>
          <span className="text-sm font-semibold text-ceda-ink">
            Application section
            <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
              *
            </span>
          </span>
          <div className="mt-1.5">
            <Controller
              control={control}
              name="sectionKey"
              render={({ field }) => (
                <SelectDropdown
                  groupLabel="Application section"
                  value={field.value}
                  options={SECTION_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Field type */}
        <div>
          <span className="text-sm font-semibold text-ceda-ink">
            Field type
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
                  groupLabel="Field type"
                  value={field.value}
                  options={FIELD_TYPE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Choices — shown only when Field type is Choose one / Choose multiple */}
        {needsChoices ? (
          <div>
            <label
              htmlFor="field-options"
              className="text-sm font-semibold text-ceda-ink"
            >
              Answer choices
              <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
                *
              </span>
            </label>
            <p id="options-help" className="mt-1 text-xs text-ceda-muted">
              Separate each choice with a comma (at least two choices).
            </p>
            <input
              id="field-options"
              required
              maxLength={2000}
              placeholder="e.g. Agriculture, Clean Energy, Healthcare"
              aria-invalid={errors.options ? "true" : "false"}
              aria-describedby={
                errors.options ? "options-help options-error" : "options-help"
              }
              className={CALL_CONFIG_FIELD_CLASS}
              {...register("options")}
            />
            <FieldErrorMessage
              id="options-error"
              message={errors.options?.message}
            />
          </div>
        ) : null}

        {/* Required answer toggle */}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-ceda-line bg-neutral-50/70 px-3.5 py-2.5 text-sm font-semibold text-ceda-ink transition hover:border-ceda-burgundy/35 hover:bg-ceda-cream/40">
          <input
            type="checkbox"
            className="h-4.5 w-4.5 shrink-0 rounded accent-ceda-burgundy"
            {...register("required")}
          />
          <span>Applicants must answer this question</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          {pending ? "Adding…" : "Add field"}
        </button>
      </form>
    </>
  );
}
