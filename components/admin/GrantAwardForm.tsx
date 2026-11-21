"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { grantAward } from "@/app/(workspace)/(dashboards)/admin/awards/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { awardSchema, type AwardFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

export function GrantAwardForm({ ideaId }: { ideaId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<AwardFormValues>({
    resolver: zodResolver(awardSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { title: "", tier: "", description: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("title", values.title);
    formData.set("tier", values.tier);
    formData.set("description", values.description);
    startTransition(async () => {
      await grantAward(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby={`award-${ideaId}`}
        className="mt-5 grid gap-4 border-t border-ceda-line pt-5 md:grid-cols-2"
      >
        <div>
          <label
            htmlFor={`award-title-${ideaId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Award title <span aria-hidden="true">*</span>
          </label>
          <input
            id={`award-title-${ideaId}`}
            maxLength={255}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={
              errors.title ? `award-title-error-${ideaId}` : undefined
            }
            className="ds-field-control mt-1 min-h-12 w-full rounded-lg border border-[#9A8175] px-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy"
            placeholder="e.g. CEDA Innovation Award"
            {...register("title")}
          />
          <FieldErrorMessage
            id={`award-title-error-${ideaId}`}
            message={errors.title?.message}
          />
        </div>

        <div>
          <label
            htmlFor={`award-tier-${ideaId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Tier <span className="font-normal text-ceda-muted">(optional)</span>
          </label>
          <input
            id={`award-tier-${ideaId}`}
            maxLength={50}
            aria-invalid={errors.tier ? "true" : "false"}
            aria-describedby={
              errors.tier ? `award-tier-error-${ideaId}` : undefined
            }
            className="ds-field-control mt-1 min-h-12 w-full rounded-lg border border-[#9A8175] px-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy"
            placeholder="e.g. Gold"
            {...register("tier")}
          />
          <FieldErrorMessage
            id={`award-tier-error-${ideaId}`}
            message={errors.tier?.message}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={`award-description-${ideaId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Recognition details{" "}
            <span className="font-normal text-ceda-muted">(optional)</span>
          </label>
          <textarea
            id={`award-description-${ideaId}`}
            rows={3}
            maxLength={2000}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby={
              errors.description ? `award-desc-error-${ideaId}` : undefined
            }
            className="ds-field-control mt-1 w-full rounded-lg border border-[#9A8175] px-3 py-2 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy"
            {...register("description")}
          />
          <FieldErrorMessage
            id={`award-desc-error-${ideaId}`}
            message={errors.description?.message}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-fit rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
        >
          {pending ? "Granting…" : "Grant award"}
        </button>
      </form>
    </>
  );
}
