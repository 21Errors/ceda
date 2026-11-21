import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  criteria,
  evaluationScores,
  formFields,
  innovationCalls,
  workflowStages,
} from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import {
  moveWorkflowStage,
  setEvaluationCriterionArchived,
  setFormFieldActive,
  updateCallStatus,
} from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import {
  AddCallFormFieldForm,
  AddCriterionForm,
  AddWorkflowStageForm,
  EditCriterionForm,
  UpdateWorkflowStageForm,
} from "@/components/admin/CallConfigForms";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";

export default function CallConfigurationPage({
  params,
  searchParams,
}: PageProps<"/admin/calls/[id]">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="detail" />}>
      <CallConfigurationContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CallConfigurationContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [call] = await db
    .select()
    .from(innovationCalls)
    .where(eq(innovationCalls.id, id))
    .limit(1);
  if (!call) notFound();
  const [fields, stages, scoringCriteria] = await Promise.all([
    db
      .select()
      .from(formFields)
      .where(eq(formFields.callId, id))
      .orderBy(asc(formFields.position)),
    db
      .select({
        id: workflowStages.id,
        key: workflowStages.key,
        name: workflowStages.name,
        description: workflowStages.description,
        type: workflowStages.type,
        position: workflowStages.position,
        isTerminal: workflowStages.isTerminal,
      })
      .from(workflowStages)
      .where(eq(workflowStages.callId, id))
      .orderBy(asc(workflowStages.position)),
    db
      .select({
        id: criteria.id,
        stageId: criteria.stageId,
        name: criteria.name,
        description: criteria.description,
        maxScore: criteria.maxScore,
        weight: criteria.weight,
        isArchived: criteria.isArchived,
        stageName: workflowStages.name,
      })
      .from(criteria)
      .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
      .where(eq(workflowStages.callId, id))
      .orderBy(asc(workflowStages.position), asc(criteria.position)),
  ]);
  const scoredCriterionRows = await db
    .select({ criterionId: evaluationScores.criterionId })
    .from(evaluationScores)
    .innerJoin(criteria, eq(evaluationScores.criterionId, criteria.id))
    .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
    .where(eq(workflowStages.callId, id));
  const scoredCriterionIds = new Set(
    scoredCriterionRows.map(({ criterionId }) => criterionId),
  );
  const error = query.error;
  const errorText =
    error === "duplicate"
      ? "That field key is already in use for this call."
      : error === "options"
        ? "Select fields need unique options, separated by commas."
        : error === "field"
          ? "Check the field key and label."
          : error === "criterion"
            ? "Check the criterion name, maximum score, and weight."
            : error === "criterion_locked"
              ? "This criterion already has scores. Archive it and add a replacement so recorded reviews keep their original meaning."
              : error === "stage_duplicate"
                ? "That workflow key is already used by another stage."
                : error === "stage"
                  ? "Check the stage name, key, and type."
                  : error === "status"
                    ? "Choose a valid call status and date range."
                    : error
                      ? "Check the configuration and try again."
                      : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5 flex flex-col gap-5 rounded-2xl bg-[#5C150D] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4B58A]">
              Call configuration
            </p>
            <h1 id="call-title" className="mt-2 text-3xl font-bold">
              {call.title}
            </h1>
            <p className="mt-2 text-sm text-white/75">/{call.slug}</p>
          </div>
          <form
            action={updateCallStatus}
            aria-labelledby="call-title"
            className="flex items-end gap-2">
            <input type="hidden" name="callId" value={call.id} />
            <div>
              <label
                htmlFor="status"
                className="text-xs font-semibold text-white/80">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={call.status}
                className="mt-1 min-h-10 rounded-lg border border-white/30 bg-white px-3 text-sm font-semibold text-ceda-ink">
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              className="min-h-10 rounded-full bg-white px-4 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF1E4]"
              type="submit">
              Save status
            </button>
          </form>
        </header>
        {errorText && (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert">
            {errorText}
          </p>
        )}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section aria-labelledby="fields-heading">
            <h2 id="fields-heading" className="text-xl font-bold text-ceda-ink">
              Submission form fields
            </h2>
            <p className="mt-1 text-sm text-ceda-muted">
              Active fields appear on the submitter form. Field keys identify
              saved answers across versions.
            </p>
            {fields.length ? (
              <div className="mt-4 space-y-3">
                {fields.map((field) => (
                  <article
                    key={field.id}
                    className={`rounded-2xl border border-ceda-line p-5 ${field.isActive ? "bg-white" : "bg-surface-muted opacity-80"}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3
                          id={`field-title-${field.id}`}
                          className="font-semibold text-ceda-ink">
                          {field.label}
                          {field.required ? " *" : ""}
                        </h3>
                        <p className="mt-1 text-xs text-ceda-muted">
                          <code>{field.key}</code> · {field.type} ·{" "}
                          {field.sectionKey.replaceAll("_", " ")}
                          {field.options?.length
                            ? ` · ${field.options.join(", ")}`
                            : ""}
                        </p>
                        {field.helpText && (
                          <p className="mt-2 text-sm text-ceda-body">
                            {field.helpText}
                          </p>
                        )}
                      </div>
                      <form
                        action={setFormFieldActive}
                        aria-labelledby={`field-title-${field.id}`}>
                        <input type="hidden" name="callId" value={call.id} />
                        <input type="hidden" name="fieldId" value={field.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={String(!field.isActive)}
                        />
                        <button
                          type="submit"
                          className="min-h-10 rounded-full border border-ceda-line px-4 text-sm font-semibold text-ceda-burgundy hover:bg-[#FFF9F4]">
                          {field.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-[#FFF9F4] p-5 text-sm text-ceda-muted">
                No fields configured.
              </p>
            )}
            <AddCallFormFieldForm callId={call.id} />
          </section>
          <aside className="space-y-6">
            <section
              className="rounded-2xl border border-ceda-line bg-white p-5 sm:p-6"
              aria-labelledby="stages-heading">
              <h2
                id="stages-heading"
                className="text-xl font-bold text-ceda-ink">
                Workflow stages
              </h2>
              <p className="mt-1 text-sm text-ceda-muted">
                Changing stage order affects future transitions for submissions
                currently in review. Existing stages and their history are
                retained.
              </p>
              <ol className="mt-4 space-y-4">
                {stages.map((stage, index) => (
                  <li
                    key={stage.id}
                    className="rounded-xl border border-ceda-line p-3">
                    <p className="text-xs font-bold text-ceda-burgundy">
                      Stage {index + 1} · {stage.type}
                      {stage.isTerminal ? " · final" : ""}
                    </p>
                    <UpdateWorkflowStageForm
                      callId={call.id}
                      stageId={stage.id}
                      name={stage.name}
                      description={stage.description ?? ""}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form
                        action={moveWorkflowStage}
                        aria-label={`Move ${stage.name} up`}>
                        <input type="hidden" name="callId" value={call.id} />
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="min-h-12 rounded-full border border-ceda-line px-4 text-xs font-bold text-ceda-burgundy disabled:opacity-40">
                          Move up
                        </button>
                      </form>
                      <form
                        action={moveWorkflowStage}
                        aria-label={`Move ${stage.name} down`}>
                        <input type="hidden" name="callId" value={call.id} />
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === stages.length - 1}
                          className="min-h-12 rounded-full border border-ceda-line px-4 text-xs font-bold text-ceda-burgundy disabled:opacity-40">
                          Move down
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ol>
              <AddWorkflowStageForm callId={call.id} />
            </section>
            <section className="rounded-2xl border border-ceda-line bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-ceda-ink">
                Evaluation criteria
              </h2>
              <p className="mt-1 text-sm text-ceda-muted">
                Criteria are versioned by stage; archived criteria remain
                available to past reviews.
              </p>
              {scoringCriteria.length ? (
                <ul className="mt-4 space-y-3">
                  {scoringCriteria.map((criterion) => (
                    <li
                      key={criterion.id}
                      className="rounded-xl bg-[#FFF9F4] p-3">
                      <p className="font-semibold text-ceda-ink">
                        {criterion.name}
                        {criterion.isArchived ? " (archived)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-ceda-muted">
                        {criterion.stageName} · max {criterion.maxScore} ·
                        weight {criterion.weight}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ceda-muted">
                  No criteria configured yet.
                </p>
              )}
              <div className="mt-4 space-y-3">
                {scoringCriteria.map((criterion) => {
                  const hasScores = scoredCriterionIds.has(criterion.id);
                  return (
                    <article
                      key={`criterion-controls-${criterion.id}`}
                      className="rounded-xl border border-ceda-line p-3">
                      {hasScores ? (
                        <p className="text-xs text-ceda-muted">
                          Scores exist; archive this criterion and create
                          another to preserve past reviews.
                        </p>
                      ) : (
                        <details>
                          <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-ceda-burgundy">
                            Edit {criterion.name}
                          </summary>
                          <EditCriterionForm
                            callId={call.id}
                            criterionId={criterion.id}
                            name={criterion.name}
                            description={criterion.description ?? ""}
                            maxScore={criterion.maxScore}
                            weight={criterion.weight}
                          />
                        </details>
                      )}
                      <form
                        action={setEvaluationCriterionArchived}
                        className="mt-2">
                        <input type="hidden" name="callId" value={call.id} />
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
                          className="min-h-12 rounded-full border border-ceda-line px-4 text-xs font-semibold text-ceda-burgundy">
                          {criterion.isArchived
                            ? "Restore criterion"
                            : "Archive criterion"}
                        </button>
                      </form>
                    </article>
                  );
                })}
              </div>
              <AddCriterionForm
                callId={call.id}
                evaluationStages={stages.filter(
                  (stage) => stage.type === "evaluation",
                )}
              />
            </section>
            <section className="rounded-2xl bg-[#FFF9F4] p-5">
              <h2 className="font-bold text-ceda-ink">Call window</h2>
              <p className="mt-2 text-sm text-ceda-body">
                Opens:{" "}
                {call.opensAt?.toLocaleString("en-BW", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Africa/Gaborone",
                }) ?? "Not set"}
              </p>
              <p className="mt-1 text-sm text-ceda-body">
                Closes:{" "}
                {call.closesAt?.toLocaleString("en-BW", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Africa/Gaborone",
                }) ?? "Not set"}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
