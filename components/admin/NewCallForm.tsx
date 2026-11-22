"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { RotateCcw } from "lucide-react";
import { createCall } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { CallStatusPills } from "@/components/admin/calls/CallStatusPills";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import { createCallSchema, type CreateCallValues } from "@/lib/form-schemas";
import { sanitizeSlugInput, toUrlSlug } from "@/lib/slugify";
import { zodResolver } from "@/lib/zod-resolver";

const fieldClass =
  "ds-input ds-field-control mt-1.5 block w-full bg-white text-ceda-ink";

export function NewCallForm() {
  const [pending, startTransition] = useTransition();
  const [isSlugManual, setIsSlugManual] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, submitCount },
  } = useForm<CreateCallValues>({
    resolver: zodResolver(createCallSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      status: "draft",
      opensAt: "",
      closesAt: "",
    },
  });

  const opensAtValue = useWatch({ control, name: "opensAt" });
  const slugValue = useWatch({ control, name: "slug" });

  const titleField = register("title");
  const slugField = register("slug");

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("slug", toUrlSlug(values.slug));
    formData.set("description", values.description);
    formData.set("status", values.status);
    formData.set("opensAt", values.opensAt);
    formData.set("closesAt", values.closesAt);
    startTransition(async () => {
      await createCall(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="create-call-heading"
        className="space-y-6 rounded-2xl border border-ceda-line bg-white p-6 shadow-xs sm:p-8"
      >
        <p className="text-xs text-ceda-muted">
          Fields marked{" "}
          <span className="font-bold text-ceda-burgundy" aria-hidden="true">
            *
          </span>{" "}
          are required.
        </p>

        {/* Call title */}
        <div>
          <label
            htmlFor="title"
            className="text-sm font-semibold text-ceda-ink"
          >
            Call title
            <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="title"
            required
            maxLength={255}
            placeholder="e.g. Youth Innovation Challenge 2027"
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "call-title-error" : undefined}
            className={fieldClass}
            {...titleField}
            onChange={(event) => {
              titleField.onChange(event);
              if (!isSlugManual) {
                setValue("slug", toUrlSlug(event.target.value), {
                  shouldValidate: submitCount > 0,
                  shouldDirty: true,
                });
              }
            }}
          />
          <FieldErrorMessage
            id="call-title-error"
            message={errors.title?.message}
          />
        </div>

        {/* URL slug */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="slug"
              className="text-sm font-semibold text-ceda-ink"
            >
              URL slug
              <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
                *
              </span>
            </label>
            {isSlugManual ? (
              <button
                type="button"
                onClick={() => {
                  setIsSlugManual(false);
                  setValue("slug", toUrlSlug(getValues("title")), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <RotateCcw aria-hidden="true" className="h-3 w-3" />
                <span>Match title</span>
              </button>
            ) : (
              <span className="text-xs text-ceda-muted">
                Auto-filled from title
              </span>
            )}
          </div>
          <p id="slug-hint" className="mt-1 text-xs text-ceda-muted">
            Lowercase letters, numbers, and hyphens only (for example:
            youth-innovation-2027).
          </p>
          <input
            id="slug"
            required
            maxLength={120}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="youth-innovation-challenge-2027"
            aria-invalid={errors.slug ? "true" : "false"}
            aria-describedby={errors.slug ? "slug-hint slug-error" : "slug-hint"}
            className={fieldClass}
            {...slugField}
            onChange={(event) => {
              const raw = event.target.value;
              const cleaned = sanitizeSlugInput(raw);
              if (cleaned !== raw) {
                event.target.value = cleaned;
              }
              setIsSlugManual(cleaned.length > 0);
              slugField.onChange(event);
            }}
            onBlur={(event) => {
              const normalized = toUrlSlug(event.target.value);
              if (normalized !== event.target.value) {
                setValue("slug", normalized, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              slugField.onBlur(event);
            }}
          />
          {slugValue ? (
            <p className="mt-1.5 text-xs text-ceda-muted">
              Page address:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-ceda-ink">
                /{toUrlSlug(slugValue)}
              </code>
            </p>
          ) : null}
          <FieldErrorMessage id="slug-error" message={errors.slug?.message} />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <p id="description-hint" className="mt-1 text-xs text-ceda-muted">
            Optional short summary shown to applicants before they apply.
          </p>
          <textarea
            id="description"
            maxLength={5000}
            rows={4}
            placeholder="Explain who can apply and what kind of ideas you are looking for."
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description
                ? "description-hint call-description-error"
                : "description-hint"
            }
            className={`${fieldClass} min-h-28 resize-y`}
            {...register("description")}
          />
          <FieldErrorMessage
            id="call-description-error"
            message={errors.description?.message}
          />
        </div>

        {/* Initial status pills */}
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <CallStatusPills
              value={field.value}
              onChange={field.onChange}
              name={field.name}
            />
          )}
        />

        {/* Opening and closing dates using custom reusable DatePicker */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="opensAt"
              className="text-sm font-semibold text-ceda-ink"
            >
              Opens
            </label>
            <div className="mt-1.5">
              <Controller
                control={control}
                name="opensAt"
                render={({ field }) => (
                  <DatePicker
                    id="opensAt"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    includeTime
                    defaultTime={{ hour: 8, minute: 0 }}
                    placeholder="Choose opening date & time"
                    invalid={Boolean(errors.opensAt)}
                    ariaDescribedBy={
                      errors.opensAt ? "opens-at-error" : undefined
                    }
                  />
                )}
              />
            </div>
            <FieldErrorMessage
              id="opens-at-error"
              message={errors.opensAt?.message}
            />
          </div>

          <div>
            <label
              htmlFor="closesAt"
              className="text-sm font-semibold text-ceda-ink"
            >
              Closes
            </label>
            <div className="mt-1.5">
              <Controller
                control={control}
                name="closesAt"
                render={({ field }) => (
                  <DatePicker
                    id="closesAt"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    includeTime
                    defaultTime={{ hour: 23, minute: 59 }}
                    minDate={opensAtValue || undefined}
                    placeholder="Choose closing date & time"
                    invalid={Boolean(errors.closesAt)}
                    ariaDescribedBy={
                      errors.closesAt ? "closes-at-error" : undefined
                    }
                  />
                )}
              />
            </div>
            <FieldErrorMessage
              id="closes-at-error"
              message={errors.closesAt?.message}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            type="submit"
            disabled={pending}
          >
            {pending ? "Creating…" : "Create call and workflow"}
          </button>
        </div>
      </form>
    </>
  );
}
