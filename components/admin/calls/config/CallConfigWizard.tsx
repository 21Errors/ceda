"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CallConfigStepper, type StepDefinition } from "./CallConfigStepper";
import { CallCriteriaStep } from "./CallCriteriaStep";
import { CallFieldsStep } from "./CallFieldsStep";
import { CallPublishStep } from "./CallPublishStep";
import { CallWorkflowStep } from "./CallWorkflowStep";
import type {
  CallConfigStepKey,
  CallConfigSummary,
  CallCriterionItem,
  CallFieldItem,
  CallStageItem,
} from "./types";

const STEP_ORDER: readonly CallConfigStepKey[] = [
  "fields",
  "stages",
  "criteria",
  "publish",
];

interface CallConfigWizardProps {
  call: CallConfigSummary;
  fields: readonly CallFieldItem[];
  stages: readonly CallStageItem[];
  criteria: readonly CallCriterionItem[];
  initialStep: CallConfigStepKey;
}

export function CallConfigWizard({
  call,
  fields,
  stages,
  criteria,
  initialStep,
}: CallConfigWizardProps) {
  const [activeStep, setActiveStep] = useState<CallConfigStepKey>(initialStep);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const activeFieldsCount = fields.filter((field) => field.isActive).length;
  const activeCriteriaCount = criteria.filter((item) => !item.isArchived).length;

  const steps: readonly StepDefinition[] = [
    {
      key: "fields",
      stepNumber: 1,
      title: "Form fields",
      subtitle: "Questions applicants fill in",
      countLabel: String(activeFieldsCount),
      completed: activeFieldsCount > 0,
    },
    {
      key: "stages",
      stepNumber: 2,
      title: "Review stages",
      subtitle: "Order of review steps",
      countLabel: String(stages.length),
      completed: stages.length > 0,
    },
    {
      key: "criteria",
      stepNumber: 3,
      title: "Scoring criteria",
      subtitle: "How evaluators grade ideas",
      countLabel: String(activeCriteriaCount),
      completed: activeCriteriaCount > 0,
    },
    {
      key: "publish",
      stepNumber: 4,
      title: "Schedule & status",
      subtitle: "Review and open the call",
      countLabel: call.status,
      completed: call.status === "open",
    },
  ];

  const currentIndex = STEP_ORDER.indexOf(activeStep);
  const prevStep = currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
  const nextStep =
    currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : null;

  function goToStep(step: CallConfigStepKey) {
    setActiveStep(step);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", step);
      window.history.replaceState(null, "", url.toString());
    }
    window.requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: false });
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <CallConfigStepper
        steps={steps}
        activeStep={activeStep}
        onSelectStep={goToStep}
      />

      {activeStep === "fields" ? (
        <CallFieldsStep
          callId={call.id}
          fields={fields}
          headingRef={stepHeadingRef}
        />
      ) : null}

      {activeStep === "stages" ? (
        <CallWorkflowStep
          callId={call.id}
          stages={stages}
          headingRef={stepHeadingRef}
        />
      ) : null}

      {activeStep === "criteria" ? (
        <CallCriteriaStep
          callId={call.id}
          criteria={criteria}
          stages={stages}
          headingRef={stepHeadingRef}
        />
      ) : null}

      {activeStep === "publish" ? (
        <CallPublishStep
          call={call}
          activeFieldsCount={activeFieldsCount}
          stagesCount={stages.length}
          activeCriteriaCount={activeCriteriaCount}
          headingRef={stepHeadingRef}
        />
      ) : null}

      {/* Step Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ceda-line bg-white px-5 py-4 shadow-xs">
        <div>
          {prevStep ? (
            <button
              type="button"
              onClick={() => goToStep(prevStep)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-5 text-sm font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span>
                Previous:{" "}
                {steps.find((step) => step.key === prevStep)?.title}
              </span>
            </button>
          ) : (
            <span className="text-xs text-ceda-muted">
              Step 1 of {steps.length}
            </span>
          )}
        </div>

        <div>
          {nextStep ? (
            <button
              type="button"
              onClick={() => goToStep(nextStep)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              <span>
                Next: {steps.find((step) => step.key === nextStep)?.title}
              </span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-xs font-medium text-ceda-muted">
              Final step — save status above when ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
