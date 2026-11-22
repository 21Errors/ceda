export interface SimilarityCandidate {
  ideaId: string;
  referenceNo: string;
  title: string;
  summary: string;
  categoryName: string | null;
  callId: string;
  callTitle: string;
  status: string;
  answersText?: string;
}

export type SimilaritySeverity = "high" | "moderate";

export interface SimilarIdeaMatch {
  ideaId: string;
  referenceNo: string;
  title: string;
  categoryName: string | null;
  callTitle: string;
  status: string;
  sameCall: boolean;
  similarityPercent: number;
  severity: SimilaritySeverity;
  matchedTerms: string[];
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "our",
  "their",
  "they",
  "them",
  "have",
  "will",
  "would",
  "could",
  "should",
  "about",
  "across",
  "through",
  "using",
  "used",
  "also",
  "more",
  "most",
  "such",
  "other",
  "each",
  "which",
  "where",
  "when",
  "while",
  "been",
  "being",
  "were",
  "than",
  "then",
  "very",
  "only",
  "over",
  "under",
  "help",
  "make",
  "provide",
  "provides",
  "providing",
  "support",
  "supporting",
  "solution",
  "proposal",
  "project",
  "idea",
  "innovation",
  "ceda",
  "botswana",
  "portal",
  "system",
  "platform",
  "service",
  "services",
]);

export function tokenizeForSimilarity(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function buildBigrams(tokens: readonly string[]): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

function buildTermFrequencies(candidate: SimilarityCandidate): Map<string, number> {
  const tf = new Map<string, number>();
  const titleTokens = tokenizeForSimilarity(candidate.title);
  const bodyTokens = tokenizeForSimilarity(
    `${candidate.summary} ${candidate.answersText ?? ""}`,
  );

  // Weight title matches 2.5x because proposal titles strongly signal duplication.
  for (const token of titleTokens) {
    tf.set(token, (tf.get(token) ?? 0) + 2.5);
  }
  for (const token of bodyTokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

export function extractAnswersText(
  answers: Record<string, unknown> | null | undefined,
): string {
  if (!answers) return "";
  const parts: string[] = [];
  for (const value of Object.values(answers)) {
    if (typeof value === "string") {
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        parts.push(value);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") parts.push(item);
      }
    }
  }
  return parts.join(" ");
}

/**
 * Finds potentially duplicate or overlapping submissions across a corpus using
 * TF-IDF cosine similarity combined with exact bigram phrase overlap.
 */
export function findSimilarSubmissions(
  targetId: string,
  corpus: readonly SimilarityCandidate[],
  options?: { minPercent?: number; limit?: number },
): SimilarIdeaMatch[] {
  const minPercent = options?.minPercent ?? 30;
  const limit = options?.limit ?? 3;

  const target = corpus.find((item) => item.ideaId === targetId);
  if (!target || corpus.length < 2) return [];

  // Build term frequencies and document frequencies across the corpus
  const tfById = new Map<string, Map<string, number>>();
  const bigramsById = new Map<string, Set<string>>();
  const docFreq = new Map<string, number>();

  for (const doc of corpus) {
    const tf = buildTermFrequencies(doc);
    tfById.set(doc.ideaId, tf);
    const allTokens = tokenizeForSimilarity(`${doc.title} ${doc.summary}`);
    bigramsById.set(doc.ideaId, buildBigrams(allTokens));

    for (const term of tf.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  const totalDocs = corpus.length;
  const idf = (term: string) =>
    Math.log((totalDocs + 1) / ((docFreq.get(term) ?? 0) + 1)) + 1;

  const toTfIdfVector = (tf: Map<string, number>) => {
    const vec = new Map<string, number>();
    let normSq = 0;
    for (const [term, weight] of tf.entries()) {
      const val = weight * idf(term);
      vec.set(term, val);
      normSq += val * val;
    }
    return { vec, norm: Math.sqrt(normSq) };
  };

  const targetTf = tfById.get(target.ideaId);
  if (!targetTf || targetTf.size === 0) return [];
  const targetVec = toTfIdfVector(targetTf);
  if (targetVec.norm === 0) return [];
  const targetBigrams = bigramsById.get(target.ideaId) ?? new Set<string>();

  const matches: SimilarIdeaMatch[] = [];

  for (const candidate of corpus) {
    if (candidate.ideaId === target.ideaId) continue;

    const candTf = tfById.get(candidate.ideaId);
    if (!candTf || candTf.size === 0) continue;
    const candVec = toTfIdfVector(candTf);
    if (candVec.norm === 0) continue;

    let dot = 0;
    const termContributions: { term: string; score: number }[] = [];

    for (const [term, targetWeight] of targetVec.vec.entries()) {
      const candWeight = candVec.vec.get(term);
      if (candWeight) {
        const contrib = targetWeight * candWeight;
        dot += contrib;
        termContributions.push({ term, score: contrib });
      }
    }

    if (dot === 0) continue;

    const cosine = dot / (targetVec.norm * candVec.norm);

    // Compute Jaccard bigram bonus for shared multi-word phrases
    const candBigrams = bigramsById.get(candidate.ideaId) ?? new Set<string>();
    let bigramOverlap = 0;
    for (const bg of targetBigrams) {
      if (candBigrams.has(bg)) bigramOverlap += 1;
    }
    const bigramUnion = targetBigrams.size + candBigrams.size - bigramOverlap;
    const bigramJaccard = bigramUnion > 0 ? bigramOverlap / bigramUnion : 0;

    // Combine cosine (85%) + bigram phrase overlap (15%), capped at 100%
    const blended = Math.min(1, cosine * 0.85 + bigramJaccard * 0.35);
    const similarityPercent = Math.round(blended * 100);

    if (similarityPercent < minPercent) continue;

    const matchedTerms = termContributions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.term);

    matches.push({
      ideaId: candidate.ideaId,
      referenceNo: candidate.referenceNo,
      title: candidate.title,
      categoryName: candidate.categoryName,
      callTitle: candidate.callTitle,
      status: candidate.status,
      sameCall: candidate.callId === target.callId,
      similarityPercent,
      severity: similarityPercent >= 55 ? "high" : "moderate",
      matchedTerms,
    });
  }

  return matches
    .sort((a, b) => b.similarityPercent - a.similarityPercent)
    .slice(0, limit);
}
