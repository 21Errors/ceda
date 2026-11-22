"use client";

import type { RefObject } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { moveWorkflowStage } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import {
  AddWorkflowStageForm,
  UpdateWorkflowStageForm,
} from "@/components/admin/calls/WorkflowStageForms";
import type { CallStageItem } from "./types";

interface CallWorkflowStepProps {
  callId: string;
  stages: readonly CallStageItem[];
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function CallWorkflowStep({
  callId,
  stages,
  headingRef,
}: CallWorkflowStepProps) {
  return (
    <section
      aria-labelledby="step-stages-heading"
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
          Step 2 of 4
        </p>
        <h2
          id="step-stages-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-xl font-bold text-ceda-ink focus:outline-none"
        >
          Review workflow stages
        </h2>
        <p className="mt-1 text-sm text-ceda-muted">
          Rename, reorder, or add stages that every application moves through
          from submission to award. Past stage history is always preserved.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        {/* Ordered stages list */}
        <div className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-ceda-line pb-3">
            <h3 className="text-base font-bold text-ceda-ink">
              Stage sequence
            </h3>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ceda-muted">
              {stages.length} stages
            </span>
          </div>

          <ol className="mt-4 space-y-3">
            {stages.map((stage, index) => (
              <li
                key={stage.id}
                className="rounded-xl border border-ceda-line bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ceda-cream text-xs font-bold tabular-nums text-ceda-burgundy">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ceda-ink">
                        {stage.name}
                      </p>
                      <p className="text-xs text-ceda-muted capitalize">
                        {stage.type}
                        {stage.isTerminal ? " · Final stage" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <form
                      action={moveWorkflowStage}
                      aria-label={`Move ${stage.name} up`}
                    >
                      <input type="hidden" name="callId" value={callId} />
                      <input type="hidden" name="stageId" value={stage.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>Up</span>
                      </button>
                    </form>
                    <form
                      action={moveWorkflowStage}
                      aria-label={`Move ${stage.name} down`}
                    >
                      <input type="hidden" name="callId" value={callId} />
                      <input type="hidden" name="stageId" value={stage.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === stages.length - 1}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>Down</span>
                      </button>
                    </form>
                  </div>
                </div>

                {stage.description ? (
                  <p className="mt-2 text-xs leading-5 text-ceda-muted">
                    {stage.description}
                  </p>
                ) : null}

                <details className="mt-3 border-t border-ceda-line/70 pt-2.5">
                  <summary className="cursor-pointer text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4">
                    Edit name or description
                  </summary>
                  <div className="mt-2">
                    <UpdateWorkflowStageForm
                      callId={callId}
                      stageId={stage.id}
                      name={stage.name}
                      description={stage.description ?? ""}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>

        {/* Add stage */}
        <div className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <AddWorkflowStageForm callId={callId} />
        </div>
      </div>
    </section>
  );
}
