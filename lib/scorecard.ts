import { BANDS, DIMENSIONS, LIMITS, type DimKey } from "@/data/rubric";

export interface DimensionScore {
  score: number;
  reason: string;
  fix: string;
}

export type Engine = "quick" | "ai";

export interface Scorecard {
  engine: Engine;
  dimensions: Record<DimKey, DimensionScore>;
  summary: string;
  improvedPrompt: string;
  total: number;
  max: number;
  band: string;
}

export class ScorecardError extends Error {}

const text = (value: unknown, field: string, maxLen: number): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ScorecardError(`Missing text for ${field}`);
  }
  return value.trim().slice(0, maxLen);
};

const score = (value: unknown, field: string): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new ScorecardError(`Missing score for ${field}`);
  return Math.min(LIMITS.maxScore, Math.max(0, Math.round(n)));
};

export function bandFor(total: number): string {
  return (BANDS.find((b) => total >= b.min) ?? BANDS[BANDS.length - 1]).label;
}

/**
 * Turns the raw reply from the model into a safe, tidy scorecard.
 * Scores are rounded and kept between 0 and 10. The total and band are worked out here
 * so the page never relies on the model to add up correctly.
 */
export function normaliseScorecard(raw: unknown, engine: Engine = "ai"): Scorecard {
  if (typeof raw !== "object" || raw === null) throw new ScorecardError("Reply was not an object");
  const obj = raw as Record<string, unknown>;

  const dimensions = {} as Record<DimKey, DimensionScore>;
  let total = 0;
  for (const d of DIMENSIONS) {
    const item = obj[d.key];
    if (typeof item !== "object" || item === null) throw new ScorecardError(`Missing ${d.key}`);
    const rec = item as Record<string, unknown>;
    const s = score(rec.score, d.key);
    dimensions[d.key] = {
      score: s,
      reason: text(rec.reason, `${d.key} reason`, 300),
      fix: text(rec.fix, `${d.key} fix`, 300),
    };
    total += s;
  }

  return {
    engine,
    dimensions,
    summary: text(obj.summary, "summary", 500),
    improvedPrompt: text(obj.improvedPrompt, "improvedPrompt", 3500),
    total,
    max: DIMENSIONS.length * LIMITS.maxScore,
    band: bandFor(total),
  };
}
