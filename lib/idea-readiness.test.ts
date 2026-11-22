import { describe, expect, it } from "vitest";
import {
  evaluateIdeaReadiness,
  type ReadinessFieldInput,
} from "./idea-readiness";

const sampleFields: ReadinessFieldInput[] = [
  {
    key: "technical_proposal_url",
    label: "Technical proposal link",
    type: "url",
    required: true,
    sectionKey: "solution_documents",
  },
];

describe("idea completeness & readiness checker", () => {
  it("flags blockers and low score on an empty draft", () => {
    const result = evaluateIdeaReadiness({
      title: "",
      summary: "",
      categoryId: "",
      solutionStatus: "",
      innovationTypes: [],
      termsAccepted: false,
      answers: {},
      fields: sampleFields,
      attachmentCount: 0,
    });

    expect(result.score).toBe(0);
    expect(result.grade).toBe("Early draft");
    expect(result.requiredFieldsFilled).toBe(0);
    expect(result.requiredFieldsTotal).toBe(1);
    expect(result.topActionItems.length).toBeGreaterThan(0);
  });

  it("scores 100 and marks Ready to submit when all rubric dimensions are strong", () => {
    const richSummary =
      "Smallholder farmers and rural SMEs across Botswana face severe post-harvest spoilage challenges and high grid energy costs. Our proposed solar cold-chain microgrid platform provides pay-as-you-go smart cooling hubs that automate temperature monitoring and connect farmers directly to regional markets. Following a 6-month pilot roadmap with local cooperative partners, the scalable revenue model creates youth jobs and reduces food loss by 40% while ensuring full compliance and measurable community impact.";

    const result = evaluateIdeaReadiness({
      title: "Solar Cold-Chain Microgrid Cooperative",
      summary: richSummary,
      categoryId: "cat-1",
      solutionStatus: "Pilot or testing",
      innovationTypes: ["Technology", "Business model"],
      termsAccepted: true,
      answers: {
        technical_proposal_url: "https://example.com/solar-proposal.pdf",
      },
      fields: sampleFields,
      attachmentCount: 2,
    });

    expect(result.score).toBe(100);
    expect(result.grade).toBe("Ready to submit");
    expect(result.topActionItems).toEqual([]);
  });

  it("warns when required URL field is invalid even if non-empty", () => {
    const result = evaluateIdeaReadiness({
      title: "Digital Livestock Traceability",
      summary:
        "A practical mobile platform solving cattle traceability challenges for rural farmers in Botswana with offline sync and scalable market compliance.",
      categoryId: "cat-1",
      solutionStatus: "Prototype in development",
      innovationTypes: ["Technology"],
      termsAccepted: true,
      answers: { technical_proposal_url: "not-a-valid-url" },
      fields: sampleFields,
      attachmentCount: 0,
    });

    const reqCheck = result.checks.find((c) => c.id === "required_fields");
    expect(reqCheck?.status).toBe("missing");
    expect(result.grade).not.toBe("Ready to submit");
  });
});
