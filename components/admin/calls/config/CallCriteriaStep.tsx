"use client";

import type { RefObject } from "react";
import { ClipboardCheck } from "lucide-react";
import { setEvaluationCriterionArchived } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import {
  AddCriterionForm,
  EditCriterionForm,
} from "@/components/admin/calls/EvaluationCriterionForms";
import type { CallCriterionItem, CallStageItem } from "./types";

interface CallCriteriaStepProps {
  callId: string;
  criteria: readonly CallCriterionItem[];
  stages: readonly CallStageItem[];
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function CallCriteriaStep({
  callId,
  criteria,
  stages,
  headingRef,
}: CallCriteriaStepProps) {
  const evaluationStages = stages
    .filter((stage) => stage.type === "evaluation")
    .map((stage) => ({ id: stage.id, name: stage.name }));

  const activeCount = criteria.filter((item) => !item.isArchived).length;

  return (
    <section
      aria-labelledby="step-criteria-heading"
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
          Step 3 of 4
        </p>
        <h2
          id="step-criteria-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-xl font-bold text-ceda-ink focus:outline-none"
        >
          Scoring criteria
        </h2>
        <p className="mt-1 text-sm text-ceda-muted">
          Define how reviewers score ideas in each evaluation stage. Archived
          criteria stay saved for past reviews.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        {/* Existing criteria */}
        <div className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-ceda-line pb-3">
            <h3 className="text-base font-bold text-ceda-ink">
              Configured criteria
            </h3>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ceda-muted">
              {activeCount} active / {criteria.length} total
            </span>
          </div>

          {criteria.length > 0 ? (
            <div className="mt-4 space-y-3">
              {criteria.map((criterion) => (
                <article
                  key={criterion.id}
                  className={`rounded-xl border border-ceda-line p-4 ${
                    criterion.isArchived
                      ? "bg-neutral-50 opacity-75"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-ceda-ink">
                          {criterion.name}
                        </h4>
                        <span className="rounded-full bg-ceda-cream px-2.5 py-0.5 text-[11px] font-semibold text-ceda-burgundy">
                          {criterion.stageName}
                        </span>
                        {criterion.isArchived ? (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                            Archived
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-ceda-muted tabular-nums">
                        Max score {criterion.maxScore} · Weight{" "}
                        {criterion.weight}
                      </p>

                      {criterion.description ? (
                        <p className="mt-2 text-sm text-ceda-body">
                          {criterion.description}
                        </p>
                      ) : null}
                    </div>

                    <form
                      action={setEvaluationCriterionArchived}
                      className="shrink-0"
                    >
                      <input type="hidden" name="callId" value={callId} />
                      <input
                        type="hidden"
                        name="criterionId"
                        value={criterion.id}
                      />
                      <input
                        type="hidden"
                        name="archived"
                        value={String(!criterion.isArchived)}
                      />
                      <button
                        type="submit"
                        className="min-h-9 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        {criterion.isArchived ? "Restore" : "Archive"}
                      </button>
                    </form>
                  </div>

                  {criterion.hasScores ? (
                    <p className="mt-3 border-t border-ceda-line/70 pt-2.5 text-xs text-ceda-muted">
                      Scores already exist for this criterion. Archive it and
                      add a new one to keep past reviews accurate.
                    </p>
                  ) : (
                    <details className="mt-3 border-t border-ceda-line/70 pt-2.5">
                      <summary className="cursor-pointer text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4">
                        Edit criterion
                      </summary>
                      <div className="mt-3">
                        <EditCriterionForm
                          callId={callId}
                          criterionId={criterion.id}
                          name={criterion.name}
                          description={criterion.description ?? ""}
                          maxScore={criterion.maxScore}
                          weight={criterion.weight}
                        />
                      </div>
                    </details>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-400 shadow-xs"
              >
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ceda-ink">
                No scoring criteria yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-ceda-muted">
                Add at least one scoring rule for your evaluation stages so
                reviewers can score applications consistently.
              </p>
            </div>
          )}
        </div>

        {/* Add criterion */}
        <div className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <AddCriterionForm
            callId={callId}
            evaluationStages={evaluationStages}
          />
        </div>
      </div>
    </section>
  );
}
