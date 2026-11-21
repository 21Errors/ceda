"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { decideSubmission } from "@/app/(workspace)/(dashboards)/adjudicator/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import {
  adjudicationDecisionSchema,
  type AdjudicationDecisionValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const inputClass =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function AdjudicationDecisionForm({ ideaId }: { ideaId: string }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<AdjudicationDecisionValues>({
    resolver: zodResolver(adjudicationDecisionSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { decision: "", rationale: "" },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("decision", values.decision);
    formData.set("rationale", values.rationale);
    startTransition(async () => {
      await decideSubmission(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby={`adjudication-${ideaId}`}
        className="mt-6 grid gap-4 border-t border-ceda-line pt-5 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)_auto] sm:items-start"
      >
        <div>
          <label
            htmlFor={`decision-${ideaId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Decision
          </label>
          <select
            id={`decision-${ideaId}`}
            aria-invalid={errors.decision ? "true" : "false"}
            aria-describedby={
              errors.decision ? `decision-error-${ideaId}` : undefined
            }
            className={inputClass}
            {...register("decision")}
          >
            <option value="" disabled>
              Choose decision
            </option>
            <option value="approved">Approve</option>
            <option value="needs_revision">Request changes</option>
            <option value="rejected">Reject</option>
          </select>
          <FieldErrorMessage
            id={`decision-error-${ideaId}`}
            message={errors.decision?.message}
          />
        </div>

        <div>
          <label
            htmlFor={`rationale-${ideaId}`}
            className="text-sm font-semibold text-ceda-ink"
          >
            Rationale <span className="text-ceda-muted">(required)</span>
          </label>
          <textarea
            id={`rationale-${ideaId}`}
            maxLength={5000}
            rows={2}
            aria-invalid={errors.rationale ? "true" : "false"}
            aria-describedby={
              errors.rationale ? `rationale-error-${ideaId}` : undefined
            }
            className={inputClass}
            {...register("rationale")}
          />
          <FieldErrorMessage
            id={`rationale-error-${ideaId}`}
            message={errors.rationale?.message}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60 sm:mt-6"
        >
          {pending ? "Recording…" : "Record decision"}
        </button>
      </form>
    </>
  );
}
