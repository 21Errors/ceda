"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createCategory,
  updateCategory,
} from "@/app/(workspace)/(dashboards)/admin/categories/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { categorySchema, type CategoryFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const fieldClass =
  "ds-field-control mt-1 block min-h-12 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function EditCategoryForm({
  categoryId,
  name,
  description,
}: {
  categoryId: string;
  name: string;
  description: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name, description },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("name", values.name);
    formData.set("description", values.description);
    startTransition(async () => {
      await updateCategory(formData);
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
            htmlFor={`category-name-${categoryId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Name
          </label>
          <input
            id={`category-name-${categoryId}`}
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={
              errors.name ? `category-name-error-${categoryId}` : undefined
            }
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id={`category-name-error-${categoryId}`}
            message={errors.name?.message}
          />
        </div>
        <div>
          <label
            htmlFor={`category-description-${categoryId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <textarea
            id={`category-description-${categoryId}`}
            maxLength={2000}
            rows={2}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? `category-desc-error-${categoryId}` : undefined
            }
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id={`category-desc-error-${categoryId}`}
            message={errors.description?.message}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center rounded-full border border-ceda-line px-5 text-sm font-bold text-ceda-burgundy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save category"}
        </button>
      </form>
    </>
  );
}

export function CreateCategoryForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("description", values.description);
    startTransition(async () => {
      await createCategory(formData);
      reset();
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="new-category-heading"
        className="mt-4 space-y-4"
      >
        <div>
          <label
            htmlFor="new-category-name"
            className="text-sm font-semibold text-ceda-ink"
          >
            Name
          </label>
          <input
            id="new-category-name"
            maxLength={150}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "new-category-name-error" : undefined}
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id="new-category-name-error"
            message={errors.name?.message}
          />
        </div>
        <div>
          <label
            htmlFor="new-category-description"
            className="text-sm font-semibold text-ceda-ink"
          >
            Description
          </label>
          <textarea
            id="new-category-description"
            maxLength={2000}
            rows={3}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? "new-category-desc-error" : undefined
            }
            className={fieldClass}
            {...register("description")}
          />
          <FieldErrorMessage
            id="new-category-desc-error"
            message={errors.description?.message}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create category"}
        </button>
      </form>
    </>
  );
}
