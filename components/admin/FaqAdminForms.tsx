"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createFaq,
  updateFaq,
} from "@/app/(workspace)/(dashboards)/admin/content/faqs/actions";
import { FieldErrorMessage, FormErrorAnnouncer } from "@/components/ui/FormErrorFeedback";
import { faqSchema, type FaqFormValues } from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const controlClass =
  "ds-field-control mt-1 min-h-12 w-full rounded-lg border border-[#9A8175] bg-white px-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function CreateFaqForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      question: "",
      topic: "",
      answer: "",
      position: "0",
      isPublished: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("question", values.question);
    formData.set("topic", values.topic);
    formData.set("answer", values.answer);
    formData.set("position", values.position || "0");
    if (values.isPublished) formData.set("isPublished", "true");
    startTransition(async () => {
      await createFaq(formData);
      reset();
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="create-faq-heading"
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <div>
          <label
            htmlFor="new-faq-question"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Question
          </label>
          <input
            id="new-faq-question"
            maxLength={500}
            aria-invalid={errors.question ? "true" : "false"}
            aria-describedby={errors.question ? "new-faq-question-error" : undefined}
            className={controlClass}
            {...register("question")}
          />
          <FieldErrorMessage
            id="new-faq-question-error"
            message={errors.question?.message}
          />
        </div>

        <div>
          <label
            htmlFor="new-faq-topic"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Topic <span className="font-normal text-ceda-muted">(optional)</span>
          </label>
          <input
            id="new-faq-topic"
            maxLength={100}
            aria-invalid={errors.topic ? "true" : "false"}
            aria-describedby={errors.topic ? "new-faq-topic-error" : undefined}
            className={controlClass}
            {...register("topic")}
          />
          <FieldErrorMessage
            id="new-faq-topic-error"
            message={errors.topic?.message}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="new-faq-answer"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Answer
          </label>
          <textarea
            id="new-faq-answer"
            maxLength={5000}
            rows={4}
            aria-invalid={errors.answer ? "true" : "false"}
            aria-describedby={errors.answer ? "new-faq-answer-error" : undefined}
            className={controlClass}
            {...register("answer")}
          />
          <FieldErrorMessage
            id="new-faq-answer-error"
            message={errors.answer?.message}
          />
        </div>

        <div>
          <label
            htmlFor="new-faq-position"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Order within topic
          </label>
          <input
            id="new-faq-position"
            type="number"
            min={0}
            max={100000}
            aria-invalid={errors.position ? "true" : "false"}
            aria-describedby={errors.position ? "new-faq-position-error" : undefined}
            className={controlClass}
            {...register("position")}
          />
          <FieldErrorMessage
            id="new-faq-position-error"
            message={errors.position?.message}
          />
        </div>

        <label className="flex min-h-12 items-center gap-3 self-end text-sm font-semibold text-ceda-ink">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#7A1F14]"
            {...register("isPublished")}
          />
          Publish on public FAQ page
        </label>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-fit rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
        >
          {pending ? "Adding…" : "Add FAQ"}
        </button>
      </form>
    </>
  );
}

export function EditFaqForm({
  faqId,
  question,
  topic,
  answer,
  position,
  isPublished,
}: {
  faqId: string;
  question: string;
  topic: string;
  answer: string;
  position: number;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      question,
      topic,
      answer,
      position: String(position),
      isPublished,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("faqId", faqId);
    formData.set("question", values.question);
    formData.set("topic", values.topic);
    formData.set("answer", values.answer);
    formData.set("position", values.position || "0");
    if (values.isPublished) formData.set("isPublished", "true");
    startTransition(async () => {
      await updateFaq(formData);
    });
  });

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        onSubmit={onSubmit}
        aria-label={`Edit FAQ: ${question}`}
        className="grid gap-4 md:grid-cols-2"
      >
        <div>
          <label
            htmlFor={`faq-question-${faqId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Question
          </label>
          <input
            id={`faq-question-${faqId}`}
            maxLength={500}
            aria-invalid={errors.question ? "true" : "false"}
            aria-describedby={
              errors.question ? `faq-question-error-${faqId}` : undefined
            }
            className={controlClass}
            {...register("question")}
          />
          <FieldErrorMessage
            id={`faq-question-error-${faqId}`}
            message={errors.question?.message}
          />
        </div>

        <div>
          <label
            htmlFor={`faq-topic-${faqId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Topic
          </label>
          <input
            id={`faq-topic-${faqId}`}
            maxLength={100}
            aria-invalid={errors.topic ? "true" : "false"}
            aria-describedby={
              errors.topic ? `faq-topic-error-${faqId}` : undefined
            }
            className={controlClass}
            {...register("topic")}
          />
          <FieldErrorMessage
            id={`faq-topic-error-${faqId}`}
            message={errors.topic?.message}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={`faq-answer-${faqId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Answer
          </label>
          <textarea
            id={`faq-answer-${faqId}`}
            maxLength={5000}
            rows={4}
            aria-invalid={errors.answer ? "true" : "false"}
            aria-describedby={
              errors.answer ? `faq-answer-error-${faqId}` : undefined
            }
            className={controlClass}
            {...register("answer")}
          />
          <FieldErrorMessage
            id={`faq-answer-error-${faqId}`}
            message={errors.answer?.message}
          />
        </div>

        <div>
          <label
            htmlFor={`faq-position-${faqId}`}
            className="block text-sm font-semibold text-ceda-ink"
          >
            Order within topic
          </label>
          <input
            id={`faq-position-${faqId}`}
            type="number"
            min={0}
            max={100000}
            aria-invalid={errors.position ? "true" : "false"}
            aria-describedby={
              errors.position ? `faq-position-error-${faqId}` : undefined
            }
            className={controlClass}
            {...register("position")}
          />
          <FieldErrorMessage
            id={`faq-position-error-${faqId}`}
            message={errors.position?.message}
          />
        </div>

        <label className="flex min-h-12 items-center gap-3 self-end text-sm font-semibold text-ceda-ink">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#7A1F14]"
            {...register("isPublished")}
          />
          Published
        </label>

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
