import { describe, expect, it } from "vitest";
import {
  findSimilarSubmissions,
  type SimilarityCandidate,
} from "./idea-similarity";

const corpus: SimilarityCandidate[] = [
  {
    ideaId: "idea-1",
    referenceNo: "CEDA-2026-AAA111",
    title: "Solar Cold-Chain Microgrid for Smallholder Farmers",
    summary:
      "Community-owned solar refrigeration hubs reducing post-harvest vegetable spoilage for smallholder farmers using pay-as-you-go mobile metering.",
    categoryName: "Sustainable Development",
    callId: "call-1",
    callTitle: "Hackathon 2026",
    status: "in_review",
  },
  {
    ideaId: "idea-2",
    referenceNo: "CEDA-2026-BBB222",
    title: "Solar Microgrid Cold-Chain Hubs for Farmers",
    summary:
      "Pay-as-you-go solar refrigeration units to prevent post-harvest spoilage for rural smallholder farmers with smart mobile metering.",
    categoryName: "Sustainable Development",
    callId: "call-1",
    callTitle: "Hackathon 2026",
    status: "submitted",
  },
  {
    ideaId: "idea-3",
    referenceNo: "CEDA-2026-CCC333",
    title: "Automated Cross-Border Customs Clearing Assistant",
    summary:
      "Document verification workflow helping freight forwarders and logistics companies file tariff declarations faster at border posts.",
    categoryName: "Digital Advancement",
    callId: "call-1",
    callTitle: "Hackathon 2026",
    status: "in_review",
  },
];

describe("automated duplicate / similar idea detection", () => {
  it("flags overlapping proposals with high similarity and matched keywords", () => {
    const matches = findSimilarSubmissions("idea-1", corpus);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.ideaId).toBe("idea-2");
    expect(matches[0]?.severity).toBe("high");
    expect(matches[0]?.similarityPercent).toBeGreaterThanOrEqual(55);
    expect(matches[0]?.matchedTerms).toContain("solar");
    expect(matches[0]?.matchedTerms).toContain("farmers");
  });

  it("returns no false positives for distinct unrelated proposals", () => {
    const matches = findSimilarSubmissions("idea-3", corpus);
    expect(matches).toEqual([]);
  });
});
