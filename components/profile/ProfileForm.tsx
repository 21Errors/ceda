"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import {
  updateProfile,
  type ProfileState,
} from "@/app/(workspace)/(account)/profile/actions";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import { profileSchema, type ProfileFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const initialState: ProfileState = {};
const fieldClass =
  "ds-field-control mt-2 block min-h-12 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function ProfileForm({
  name,
  organisation,
  jobTitle,
}: {
  name: string;
  organisation: string;
  jobTitle: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name, organisation, jobTitle },
  });

  function onSubmit(values: ProfileFormValues) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("organisation", values.organisation);
    formData.set("jobTitle", values.jobTitle);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-labelledby="profile-form-heading"
        className="space-y-5"
      >
        <h2 id="profile-form-heading" className="text-xl font-bold text-ceda-ink">
          Personal information
        </h2>
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-ceda-ink">
            Full name
          </label>
          <input
            id="name"
            autoComplete="name"
            maxLength={120}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
            className={fieldClass}
            {...register("name")}
          />
          <FieldErrorMessage
            id="profile-name-error"
            message={errors.name?.message}
          />
        </div>
        <div>
          <label
            htmlFor="organisation"
            className="text-sm font-semibold text-ceda-ink"
          >
            Organisation
          </label>
          <input
            id="organisation"
            autoComplete="organization"
            maxLength={255}
            aria-invalid={errors.organisation ? "true" : "false"}
            aria-describedby={
              errors.organisation ? "profile-org-error" : undefined
            }
            className={fieldClass}
            {...register("organisation")}
          />
          <FieldErrorMessage
            id="profile-org-error"
            message={errors.organisation?.message}
          />
        </div>
        <div>
          <label
            htmlFor="jobTitle"
            className="text-sm font-semibold text-ceda-ink"
          >
            Job title
          </label>
          <input
            id="jobTitle"
            autoComplete="organization-title"
            maxLength={150}
            aria-invalid={errors.jobTitle ? "true" : "false"}
            aria-describedby={
              errors.jobTitle ? "profile-title-error" : undefined
            }
            className={fieldClass}
            {...register("jobTitle")}
          />
          <FieldErrorMessage
            id="profile-title-error"
            message={errors.jobTitle?.message}
          />
        </div>
        {state.error ? (
          <p
            className="rounded-xl border border-red-800/25 bg-red-50 p-3 text-sm text-red-900"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p
            className="rounded-xl border border-green-800/20 bg-green-50 p-3 text-sm text-green-900"
            role="status"
          >
            {state.success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </>
  );
}
