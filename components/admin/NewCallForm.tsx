"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { createCall } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { createCallSchema, type CreateCallValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const fieldClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function NewCallForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
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

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("slug", values.slug);
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
        className="mt-7 space-y-5 rounded-2xl border border-ceda-line p-6 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-ceda-ink">
            Call title
          </label>
          <input
            id="title"
            maxLength={255}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "call-title-error" : undefined}
            className={fieldClass}
            {...register("title")}
          />
          <FieldErrorMessage id="call-title-error" message={errors.title?.message} />
        </div>

        <div>
          <label htmlFor="slug" className="text-sm font-semibold text-ceda-ink">
            URL slug
          </label>
          <p id="slug-hint" className="mt-1 text-xs text-ceda-muted">
            Lowercase letters, numbers, and hyphens, such as youth-innovation-2027.
          </p>
          <input
            id="slug"
            maxLength={120}
            aria-invalid={errors.slug ? "true" : "false"}
            aria-describedby={errors.slug ? "slug-hint slug-error" : "slug-hint"}
            className={fieldClass}
            {...register("slug")}
          />
          <FieldErrorMessage id="slug-error" message={errors.slug?.message} />
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-semibold text-ceda-ink">
            Description
          </label>
          <textarea
            id="description"
            maxLength={5000}
            rows={4}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={errors.description ? "call-description-error" : undefined}
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id="call-description-error"
            message={errors.description?.message}
          />
        </div>

        <div>
          <label htmlFor="status" className="text-sm font-semibold text-ceda-ink">
            Initial status
          </label>
          <select id="status" className={fieldClass} {...register("status")}>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="opensAt" className="text-sm font-semibold text-ceda-ink">
              Opens (Gaborone time)
            </label>
            <input
              id="opensAt"
              type="datetime-local"
              aria-invalid={errors.opensAt ? "true" : "false"}
              className={fieldClass}
              {...register("opensAt")}
            />
          </div>
          <div>
            <label htmlFor="closesAt" className="text-sm font-semibold text-ceda-ink">
              Closes (Gaborone time)
            </label>
            <input
              id="closesAt"
              type="datetime-local"
              aria-invalid={errors.closesAt ? "true" : "false"}
              aria-describedby={errors.closesAt ? "closes-at-error" : undefined}
              className={fieldClass}
              {...register("closesAt")}
            />
            <FieldErrorMessage
              id="closes-at-error"
              message={errors.closesAt?.message}
            />
          </div>
        </div>

        <button
          className="inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
          type="submit"
          disabled={pending}
        >
          {pending ? "Creating…" : "Create call and workflow"}
        </button>
      </form>
    </>
  );
}
