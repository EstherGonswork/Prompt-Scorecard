import { describe, expect, it } from "vitest";
import { bandFor, normaliseScorecard, ScorecardError } from "@/lib/scorecard";

const dim = (score: number) => ({ score, reason: "Because.", fix: "Do this." });
const raw = (s = 5) => ({
  clarity: dim(s), context: dim(s), creativity: dim(s), constraints: dim(s),
  summary: "Summary.", improvedPrompt: "Better prompt.",
});

describe("normaliseScorecard", () => {
  it("computes the total and band in code", () => {
    const c = normaliseScorecard({ ...raw(9), summary: "Fine." }, "quick");
    expect(c.total).toBe(36);
    expect(c.band).toBe("Excellent");
    expect(c.engine).toBe("quick");
  });
  it("clamps and rounds scores", () => {
    const c = normaliseScorecard({ ...raw(), clarity: dim(99), context: dim(-4), creativity: dim(2.6) });
    expect(c.dimensions.clarity.score).toBe(10);
    expect(c.dimensions.context.score).toBe(0);
    expect(c.dimensions.creativity.score).toBe(3);
  });
  it("trims long text", () => {
    const c = normaliseScorecard({ ...raw(), summary: "s".repeat(900) });
    expect(c.summary.length).toBe(500);
  });
  it("rejects missing parts", () => {
    expect(() => normaliseScorecard(null)).toThrow(ScorecardError);
    expect(() => normaliseScorecard({ ...raw(), context: undefined })).toThrow(ScorecardError);
    expect(() => normaliseScorecard({ ...raw(), improvedPrompt: " " })).toThrow(ScorecardError);
  });
  it("maps totals to bands", () => {
    expect([40, 33, 32, 25, 24, 15, 14, 0].map(bandFor)).toEqual([
      "Excellent", "Excellent", "Solid", "Solid", "Getting there", "Getting there", "Needs work", "Needs work",
    ]);
  });
});
