"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { X, Bell, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  alertSubscriptionSchema,
  type AlertSubscriptionValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertModal({ isOpen, onClose }: AlertModalProps) {
  const [submittedContact, setSubmittedContact] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, submitCount },
  } = useForm<AlertSubscriptionValues>({
    resolver: zodResolver(alertSubscriptionSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { refNo: "", contact: "", channel: "both" },
  });

  const channel = useWatch({ control, name: "channel" });

  if (!isOpen) return null;

  const onSubmit = (values: AlertSubscriptionValues) => {
    setSubmittedContact(values.contact);
  };

  const handleClose = () => {
    setSubmittedContact(null);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#37231A]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#FFF9F4] border border-[#7A1F14]/20 p-6 sm:p-8 shadow-2xl text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 rounded-full p-2 text-[#573E32] hover:text-[#7A1F14] hover:bg-[#FFF0E2] transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {!submittedContact ? (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E2] text-[#7A1F14] mb-4 border border-[#7A1F14]/15">
              <Bell className="h-6 w-6 text-[#E8710A]" />
            </div>

            <h3 id="alert-modal-title" className="text-xl font-black text-[#37231A]">
              Subscribe to Free Submission Alerts
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#573E32] leading-relaxed">
              Stay informed as your proposal progresses through screening, evaluation, revision requests, and final adjudication.
            </p>

            <FormErrorAnnouncer errors={errors} submitCount={submitCount} />

            <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="alert-ref-no" className="block text-xs font-bold text-[#37231A] mb-1">
                  Idea Reference Number (Optional)
                </label>
                <input
                  id="alert-ref-no"
                  type="text"
                  placeholder="e.g. CEDA-2026-0001"
                  aria-invalid={errors.refNo ? "true" : "false"}
                  aria-describedby={errors.refNo ? "alert-ref-error" : undefined}
                  className="ds-field-control w-full rounded-2xl border border-[#7A1F14]/20 bg-white px-4 py-2.5 text-xs text-[#37231A] placeholder:text-[#573E32]/50 focus:outline-none focus:ring-2 focus:ring-[#7A1F14]"
                  {...register("refNo")}
                />
                <FieldErrorMessage id="alert-ref-error" message={errors.refNo?.message} />
              </div>

              <div>
                <label htmlFor="alert-contact" className="block text-xs font-bold text-[#37231A] mb-1">
                  Email Address or Botswana Phone (+267) *
                </label>
                <input
                  id="alert-contact"
                  type="text"
                  placeholder="user@example.com or +267 71 234 567"
                  aria-invalid={errors.contact ? "true" : "false"}
                  aria-describedby={errors.contact ? "alert-contact-error" : undefined}
                  className="ds-field-control w-full rounded-2xl border border-[#7A1F14]/20 bg-white px-4 py-2.5 text-xs text-[#37231A] placeholder:text-[#573E32]/50 focus:outline-none focus:ring-2 focus:ring-[#7A1F14]"
                  {...register("contact")}
                />
                <FieldErrorMessage id="alert-contact-error" message={errors.contact?.message} />
              </div>

              <div>
                <span className="block text-xs font-bold text-[#37231A] mb-1.5">
                  Notification Channel
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      ["both", "SMS & Email"],
                      ["email", "Email Only"],
                      ["sms", "SMS Only"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("channel", value, { shouldValidate: true })}
                      className={`rounded-xl py-2 px-3 border text-center font-bold transition ${
                        channel === value
                          ? "border-[#7A1F14] bg-[#7A1F14] text-white shadow-sm"
                          : "border-[#7A1F14]/20 bg-white text-[#573E32]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#573E32]">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero charge. Unsubscribe anytime in accordance with DPA 2024.</span>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#7A1F14] py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#60170E] transition shadow-md active:scale-[0.98]"
              >
                Activate Free Alerts
              </button>
            </form>
          </div>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-[#37231A]">
              Alerts Activated!
            </h3>
            <p className="text-xs sm:text-sm text-[#573E32] leading-relaxed">
              We have linked <strong>{submittedContact}</strong> to automatic milestone notifications. You will receive updates at zero cost whenever an action is performed on your proposal.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-full bg-[#7A1F14] text-white px-8 py-2.5 text-xs font-bold hover:bg-[#60170E] transition shadow"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
