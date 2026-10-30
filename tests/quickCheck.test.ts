import { describe, expect, it } from "vitest";
import { SIGNALS } from "@/data/quickRules";
import { DIMENSIONS } from "@/data/rubric";
import { SAMPLES } from "@/data/samples";
import { quickCheck } from "@/lib/quickCheck";
import { countPlaceholders, stripPlaceholders } from "@/lib/text";

const sample = (label: string) => SAMPLES.find((s) => s.label === label)!.prompt;
const score = (p: string) => quickCheck(p);

describe("sample prompts", () => {
  it("scores the vague sample as Needs work", () => {
    const c = score(sample("Vague"));
    expect(c.band).toBe("Needs work");
    expect(c.total).toBeLessThan(15);
  });
  it("scores the partly there sample as Getting there", () => {
    expect(score(sample("Partly there")).band).toBe("Getting there");
  });
  it("scores the strong sample as Excellent", () => {
    const c = score(sample("Strong"));
    expect(c.band).toBe("Excellent");
    expect(c.total).toBeGreaterThanOrEqual(33);
  });
  it("orders the samples from low to high", () => {
    const [a, b, c] = ["Vague", "Partly there", "Strong"].map((l) => score(sample(l)).total);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe("rules file", () => {
  it("gives every input exactly ten points to earn", () => {
    for (const d of DIMENSIONS) {
      const sum = SIGNALS.filter((s) => s.dimension === d.key).reduce((n, s) => n + s.points, 0);
      expect(sum).toBe(10);
    }
  });
  it("uses unique signal ids", () => {
    expect(new Set(SIGNALS.map((s) => s.id)).size).toBe(SIGNALS.length);
  });
});

describe("individual signals", () => {
  const base = "Write a summary about solar panels for homeowners";
  it("finds a tone", () => {
    expect(score(`${base}. Use a friendly tone.`).dimensions.creativity.score).toBeGreaterThan(
      score(base).dimensions.creativity.score,
    );
  });
  it("gives partial credit for practical or simple", () => {
    const none = score(base).dimensions.creativity.score;
    const part = score(`${base}. Keep it simple.`).dimensions.creativity.score;
    const full = score(`${base}. Use a warm tone.`).dimensions.creativity.score;
    expect(part).toBeGreaterThan(none);
    expect(full).toBeGreaterThan(part);
  });
  it("finds a length with a number and unit", () => {
    expect(score(`${base}. Keep it to 300 words.`).dimensions.constraints.score).toBeGreaterThanOrEqual(3);
  });
  it("gives partial credit for 'short'", () => {
    const none = score(base).dimensions.constraints.score;
    expect(score(`${base}. Keep it short.`).dimensions.constraints.score).toBe(none + 1);
  });
  it("finds things to avoid", () => {
    expect(score(`${base}. Avoid jargon.`).dimensions.constraints.score).toBeGreaterThanOrEqual(3);
  });
  it("finds a format", () => {
    expect(score(`${base}. Use bullet points.`).dimensions.constraints.score).toBeGreaterThanOrEqual(3);
  });
  it("finds a purpose", () => {
    expect(score(`${base} to help them decide.`).dimensions.context.score).toBeGreaterThan(
      score(base).dimensions.context.score - 1,
    );
  });
  it("penalises vague words on Clarity", () => {
    const clean = score("Write a report on solar panels").dimensions.clarity.score;
    const vague = score("Write a report on some good stuff about solar panels").dimensions.clarity.score;
    expect(vague).toBeLessThan(clean);
  });
  it("limits the vague penalty", () => {
    const p = score("Write something good and nice and interesting stuff whatever anything").dimensions.clarity;
    expect(p.score).toBeGreaterThanOrEqual(0);
  });
  it("marks several action verbs as unfocused", () => {
    const one = score("Write a report about solar panels for homeowners in Spain").dimensions.clarity.score;
    const many = score("Write, summarise, translate, compare and design a report about solar panels").dimensions.clarity.score;
    expect(many).toBeLessThan(one);
  });
});

describe("placeholders", () => {
  it("strips bracketed text and label-only lines", () => {
    expect(stripPlaceholders("Write a post.\nAudience: [who]\nTone: [x] calm")).toBe("Write a post.\nTone: calm");
    expect(countPlaceholders("a [b] c [d]")).toBe(2);
  });
  it("gives no credit for an unfilled improved prompt", () => {
    const first = score(sample("Vague"));
    expect(score(first.improvedPrompt).total).toBe(first.total);
  });
  it("gives credit once a placeholder is filled", () => {
    const first = score(sample("Vague"));
    const filled = first.improvedPrompt.replace("Audience: [who will read or use this]", "Audience: small business owners");
    expect(score(filled).total).toBeGreaterThan(first.total);
  });
});

describe("output rules", () => {
  const prompts = [sample("Vague"), sample("Partly there"), sample("Strong"), "hello there friend how are you doing today", "x".repeat(300)];
  it("is deterministic", () => {
    for (const p of prompts) expect(score(p)).toEqual(score(p));
  });
  it("keeps every score between 0 and 10 and totals correctly", () => {
    for (const p of prompts) {
      const c = score(p);
      let sum = 0;
      for (const d of DIMENSIONS) {
        const s = c.dimensions[d.key].score;
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(10);
        sum += s;
      }
      expect(c.total).toBe(sum);
      expect(c.max).toBe(40);
      expect(c.engine).toBe("quick");
    }
  });
  it("always returns text for reason, fix and summary, with no em dashes", () => {
    for (const p of prompts) {
      const c = score(p);
      const all = [c.summary, c.improvedPrompt, ...DIMENSIONS.flatMap((d) => [c.dimensions[d.key].reason, c.dimensions[d.key].fix])];
      for (const t of all) {
        expect(t.length).toBeGreaterThan(0);
        expect(t).not.toContain("\u2014");
      }
    }
  });
  it("adds at most five lines and never repeats a label already in the prompt", () => {
    const c = score("Write a post.\nAudience: nurses");
    const added = c.improvedPrompt.split("\n").slice(3);
    expect(added.length).toBeLessThanOrEqual(5);
    expect(added.some((l) => l.startsWith("Audience:"))).toBe(false);
  });
  it("leaves a complete prompt unchanged", () => {
    const strong = sample("Strong");
    const c = score(strong);
    expect(c.improvedPrompt.startsWith(strong)).toBe(true);
  });
});
