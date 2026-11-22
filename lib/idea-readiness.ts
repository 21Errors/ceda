export interface ReadinessFieldInput {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "multiselect"
    | "checkbox"
    | "date"
    | "url";
  required: boolean;
  sectionKey: string;
}

export interface ReadinessEvaluationInput {
  title: string;
  summary: string;
  categoryId: string;
  solutionStatus: string;
  innovationTypes: readonly string[];
  termsAccepted: boolean;
  answers: Record<string, string | boolean | string[] | undefined>;
  fields: readonly ReadinessFieldInput[];
  attachmentCount: number;
}

export type ReadinessCheckStatus = "pass" | "warn" | "missing";

export interface ReadinessCheckItem {
  id: string;
  label: string;
  status: ReadinessCheckStatus;
  points: number;
  maxPoints: number;
  guidance: string;
  targetSectionIndex: number;
}

export type ReadinessGrade =
  | "Ready to submit"
  | "Strong draft"
  | "Needs detail"
  | "Early draft";

export interface IdeaReadinessResult {
  score: number;
  grade: ReadinessGrade;
  checks: ReadinessCheckItem[];
  summaryWordCount: number;
  requiredFieldsTotal: number;
  requiredFieldsFilled: number;
  topActionItems: { label: string; guidance: string; targetSectionIndex: number }[];
}

const SECTION_INDEX_BY_KEY: Record<string, number> = {
  terms_and_conditions: 0,
  general_information: 1,
  solution_status: 2,
  solution_overview: 3,
  type_of_innovation: 4,
  additional_information: 5,
  solution_documents: 6,
};

const PROBLEM_SIGNALS =
  /\b(problem|challenge|gap|barrier|inefficien|shortage|bottleneck|struggle|lack|delay|costly|risk|issue|unmet|pain)/i;
const SOLUTION_SIGNALS =
  /\b(solution|platform|system|portal|app|service|tool|process|model|product|automat|digitiz|connect|framework|device|prototype)/i;
const IMPACT_SIGNALS =
  /\b(botswana|sme|citizen|communit|rural|job|employment|youth|farmer|enterprise|revenue|growth|sustainab|impact|customer|beneficiar|market|access)/i;
const DELIVERY_SIGNALS =
  /\b(pilot|phase|roadmap|timeline|budget|revenue|scalab|scale|partner|team|deploy|launch|pricing|metric|kpi|securit|compliance)/i;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function isFieldFilled(
  field: ReadinessFieldInput,
  value: string | boolean | string[] | undefined,
): boolean {
  if (field.type === "checkbox") return value === true;
  if (field.type === "multiselect") {
    return Array.isArray(value) && value.length > 0;
  }
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (field.type === "url") {
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
  return true;
}

function hasAnyValidUrl(
  answers: Record<string, string | boolean | string[] | undefined>,
): boolean {
  for (const val of Object.values(answers)) {
    if (typeof val !== "string") continue;
    const trimmed = val.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      continue;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return true;
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  return false;
}

export function evaluateIdeaReadiness(
  input: ReadinessEvaluationInput,
): IdeaReadinessResult {
  const checks: ReadinessCheckItem[] = [];

  // 1. Title clarity (10 pts)
  const cleanTitle = input.title.trim();
  const titleWords = countWords(cleanTitle);
  const isPlaceholderTitle =
    !cleanTitle || /^untitled submission$/i.test(cleanTitle);
  if (isPlaceholderTitle || cleanTitle.length < 5) {
    checks.push({
      id: "title",
      label: "Idea title",
      status: "missing",
      points: 0,
      maxPoints: 10,
      guidance:
        "Add a clear, specific title (at least 5 characters) that describes your innovation.",
      targetSectionIndex: 0,
    });
  } else if (cleanTitle.length >= 12 && titleWords >= 3) {
    checks.push({
      id: "title",
      label: "Idea title",
      status: "pass",
      points: 10,
      maxPoints: 10,
      guidance: "Clear, descriptive title ready for reviewers.",
      targetSectionIndex: 0,
    });
  } else {
    checks.push({
      id: "title",
      label: "Idea title",
      status: "warn",
      points: 6,
      maxPoints: 10,
      guidance:
        "Consider expanding your title to 3+ words so evaluators can immediately tell what it solves.",
      targetSectionIndex: 0,
    });
  }

  // 2. Summary depth & rubric coverage (25 pts)
  const cleanSummary = input.summary.trim();
  const summaryWordCount = countWords(cleanSummary);
  const coveredPillars = [
    PROBLEM_SIGNALS.test(cleanSummary) ? "problem" : null,
    SOLUTION_SIGNALS.test(cleanSummary) ? "solution" : null,
    IMPACT_SIGNALS.test(cleanSummary) ? "impact" : null,
    DELIVERY_SIGNALS.test(cleanSummary) ? "delivery" : null,
  ].filter(Boolean) as string[];

  const missingPillars = (
    ["problem", "solution", "impact", "delivery"] as const
  ).filter((pillar) => !coveredPillars.includes(pillar));

  if (cleanSummary.length < 30) {
    checks.push({
      id: "summary",
      label: "Problem & solution summary",
      status: "missing",
      points: 0,
      maxPoints: 25,
      guidance:
        "Write at least 30 characters explaining the problem, your proposed solution, and its impact in Botswana.",
      targetSectionIndex: 3,
    });
  } else {
    const lengthScore =
      summaryWordCount >= 60 ? 13 : summaryWordCount >= 30 ? 9 : 5;
    const pillarScore = Math.min(12, coveredPillars.length * 3);
    const totalSummaryPoints = Math.min(25, lengthScore + pillarScore);
    const isStrong = totalSummaryPoints >= 21;

    checks.push({
      id: "summary",
      label: "Problem & solution summary",
      status: isStrong ? "pass" : "warn",
      points: totalSummaryPoints,
      maxPoints: 25,
      guidance: isStrong
        ? `Strong ${summaryWordCount}-word overview covering problem, solution, and impact.`
        : `Currently ${summaryWordCount} words. Strengthen by explicitly detailing ${missingPillars.length ? missingPillars.join(", ") : "measurable outcomes and delivery milestones"} (aim for 60+ words).`,
      targetSectionIndex: 3,
    });
  }

  // 3. Sector, maturity & innovation classification (15 pts)
  const hasCategory = Boolean(input.categoryId.trim());
  const hasStage = Boolean(input.solutionStatus.trim());
  const hasTypes = input.innovationTypes.length > 0;
  const classPoints =
    (hasCategory ? 5 : 0) + (hasStage ? 5 : 0) + (hasTypes ? 5 : 0);

  if (classPoints === 15) {
    checks.push({
      id: "classification",
      label: "Sector, stage & innovation type",
      status: "pass",
      points: 15,
      maxPoints: 15,
      guidance: "Category, maturity stage, and innovation type are all selected.",
      targetSectionIndex: 1,
    });
  } else {
    const missingParts = [
      !hasCategory ? "sector category" : null,
      !hasStage ? "solution stage" : null,
      !hasTypes ? "innovation type" : null,
    ].filter(Boolean);
    const firstMissingIndex = !hasCategory ? 1 : !hasStage ? 2 : 4;
    checks.push({
      id: "classification",
      label: "Sector, stage & innovation type",
      status: classPoints === 0 ? "missing" : "warn",
      points: classPoints,
      maxPoints: 15,
      guidance: `Complete your ${missingParts.join(", ")} so your idea routes to the right evaluators.`,
      targetSectionIndex: firstMissingIndex,
    });
  }

  // 4. Required dynamic call fields (25 pts)
  const requiredFields = input.fields.filter((field) => field.required);
  const missingRequired = requiredFields.filter(
    (field) => !isFieldFilled(field, input.answers[field.key]),
  );
  const requiredFieldsFilled = requiredFields.length - missingRequired.length;

  if (requiredFields.length === 0 || missingRequired.length === 0) {
    checks.push({
      id: "required_fields",
      label: "Required call questions",
      status: "pass",
      points: 25,
      maxPoints: 25,
      guidance:
        requiredFields.length === 0
          ? "No extra mandatory fields are configured for this call."
          : `All ${requiredFields.length} mandatory call field${requiredFields.length === 1 ? "" : "s"} completed.`,
      targetSectionIndex: 5,
    });
  } else {
    const ratio = requiredFieldsFilled / requiredFields.length;
    const pts = Math.round(ratio * 25);
    const firstMissing = missingRequired[0];
    checks.push({
      id: "required_fields",
      label: "Required call questions",
      status: requiredFieldsFilled === 0 ? "missing" : "warn",
      points: pts,
      maxPoints: 25,
      guidance: `Complete required field${missingRequired.length === 1 ? "" : "s"}: ${missingRequired
        .slice(0, 2)
        .map((f) => f.label)
        .join(", ")}${missingRequired.length > 2 ? ` (+${missingRequired.length - 2} more)` : ""}.`,
      targetSectionIndex: SECTION_INDEX_BY_KEY[firstMissing.sectionKey] ?? 5,
    });
  }

  // 5. Supporting evidence & attachments (15 pts)
  const hasFiles = input.attachmentCount > 0;
  const hasLinks = hasAnyValidUrl(input.answers);
  if (hasFiles && hasLinks) {
    checks.push({
      id: "evidence",
      label: "Supporting documents & links",
      status: "pass",
      points: 15,
      maxPoints: 15,
      guidance: `${input.attachmentCount} file${input.attachmentCount === 1 ? "" : "s"} attached plus valid proposal/prototype link.`,
      targetSectionIndex: 6,
    });
  } else if (hasFiles || hasLinks) {
    checks.push({
      id: "evidence",
      label: "Supporting documents & links",
      status: "pass",
      points: 12,
      maxPoints: 15,
      guidance: hasFiles
        ? `${input.attachmentCount} supporting file${input.attachmentCount === 1 ? "" : "s"} attached. Adding a live demo or proposal URL can strengthen your review.`
        : "Valid proposal/prototype link provided. Uploading a pitch deck or budget sheet can further strengthen evaluation.",
      targetSectionIndex: 6,
    });
  } else {
    checks.push({
      id: "evidence",
      label: "Supporting documents & links",
      status: "warn",
      points: 0,
      maxPoints: 15,
      guidance:
        "Upload a pitch deck/supporting document or provide a valid proposal URL to give evaluators concrete evidence.",
      targetSectionIndex: 6,
    });
  }

  // 6. Governance & Terms acceptance (10 pts)
  if (input.termsAccepted) {
    checks.push({
      id: "terms",
      label: "Terms & DPA 2024 acceptance",
      status: "pass",
      points: 10,
      maxPoints: 10,
      guidance: "Submission terms and conditions confirmed.",
      targetSectionIndex: 0,
    });
  } else {
    checks.push({
      id: "terms",
      label: "Terms & DPA 2024 acceptance",
      status: "missing",
      points: 0,
      maxPoints: 10,
      guidance:
        "Confirm the submission terms and conditions before submitting.",
      targetSectionIndex: 0,
    });
  }

  const score = Math.min(
    100,
    checks.reduce((sum, item) => sum + item.points, 0),
  );
  const hasBlockers = checks.some((item) => item.status === "missing");

  const grade: ReadinessGrade =
    !hasBlockers && score >= 85
      ? "Ready to submit"
      : !hasBlockers && score >= 65
        ? "Strong draft"
        : score >= 40
          ? "Needs detail"
          : "Early draft";

  const topActionItems = checks
    .filter((item) => item.status !== "pass")
    .sort((a, b) => {
      if (a.status === "missing" && b.status !== "missing") return -1;
      if (b.status === "missing" && a.status !== "missing") return 1;
      return b.maxPoints - b.points - (a.maxPoints - a.points);
    })
    .slice(0, 3)
    .map((item) => ({
      label: item.label,
      guidance: item.guidance,
      targetSectionIndex: item.targetSectionIndex,
    }));

  return {
    score,
    grade,
    checks,
    summaryWordCount,
    requiredFieldsTotal: requiredFields.length,
    requiredFieldsFilled,
    topActionItems,
  };
}
