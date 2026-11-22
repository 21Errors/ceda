import type { PipelineStageKey } from "@/components/ui/PipelineStepper";

const REFERENCE_PATTERN = /^CEDA-\d{4}-[A-Z0-9]{4,16}$/;

export function normalizeReferenceInput(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

export function isValidReferenceFormat(referenceNo: string): boolean {
  return REFERENCE_PATTERN.test(normalizeReferenceInput(referenceNo));
}

export interface PipelineStageState {
  currentStage: PipelineStageKey;
  changesRequested: boolean;
  isRejected: boolean;
  isWithdrawn: boolean;
}

export function mapIdeaToPipelineStage(
  status: string,
  stageType?: string | null,
): PipelineStageState {
  if (status === "awarded" || stageType === "award") {
    return {
      currentStage: "award",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    };
  }

  if (status === "approved") {
    return {
      currentStage: "approval",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    };
  }

  if (status === "rejected") {
    return {
      currentStage: "approval",
      changesRequested: false,
      isRejected: true,
      isWithdrawn: false,
    };
  }

  if (status === "changes_requested" || stageType === "feedback") {
    return {
      currentStage: "feedback",
      changesRequested: status === "changes_requested",
      isRejected: false,
      isWithdrawn: false,
    };
  }

  if (stageType === "adjudication" || stageType === "decision") {
    return {
      currentStage: "approval",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    };
  }

  if (
    status === "in_review" ||
    stageType === "screening" ||
    stageType === "evaluation"
  ) {
    return {
      currentStage: "review",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    };
  }

  return {
    currentStage: "submission",
    changesRequested: false,
    isRejected: false,
    isWithdrawn: status === "withdrawn",
  };
}

export function getTrackingNextStep(
  status: string,
  stageName?: string | null,
): string {
  switch (status) {
    case "draft":
      return "This submission is still a saved draft. Complete any remaining sections and submit it before the call closes.";
    case "submitted":
      return "Your submission has been received and logged. Evaluators will pick it up for initial screening and review.";
    case "in_review":
      return stageName
        ? `Currently progressing through ${stageName}. You will receive an alert automatically whenever the stage or status changes.`
        : "Your submission is under active evaluation. You will receive an alert when a stage update or decision is recorded.";
    case "changes_requested":
      return "Action required: Adjudicators requested revisions. Open your submission details to review the rationale and submit an updated version.";
    case "approved":
      return "Your submission has been approved by the adjudication panel and is queued for final award recognition.";
    case "awarded":
      return "Congratulations — this submission has received formal CEDA award recognition.";
    case "rejected":
      return "This submission was not selected to advance. Open your submission details to view the adjudication rationale and evaluator feedback.";
    case "withdrawn":
      return "This submission has been withdrawn from the active review pipeline.";
    default:
      return "Track updates here or enable alerts to be notified whenever your submission moves to a new stage.";
  }
}
