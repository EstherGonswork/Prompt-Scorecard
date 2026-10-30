import { DIMENSIONS, LIMITS, type DimKey } from "@/data/rubric";
import { ACTION_VERB_SOURCE, MAX_REWRITE_LINES, SIGNALS, VAGUE, type Signal } from "@/data/quickRules";
import { bandFor, type DimensionScore, type Scorecard } from "@/lib/scorecard";
import { stripPlaceholders, wordCount } from "@/lib/text";

interface Hit {
  signal: Signal;
  earned: number;
}

const MAX_LISTED = 3;

function hasSpecifics(text: string): boolean {
  if (/\d/.test(text) || /["“”][^"“”]{2,}["“”]/.test(text)) return true;
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.some((t, i) => {
    if (i === 0 || !/^[A-Z][a-z]{2,}/.test(t)) return false;
    return !/[.!?:]$/.test(tokens[i - 1]);
  });
}

function distinctVerbs(text: string): number {
  const found = text.toLowerCase().match(new RegExp(ACTION_VERB_SOURCE, "gi")) ?? [];
  return new Set(found.map((w) => w.toLowerCase())).size;
}

function matches(patterns: RegExp[] | undefined, text: string): boolean {
  return (patterns ?? []).some((p) => p.test(text));
}

function earnedFor(signal: Signal, text: string, words: number): number {
  let full = false;
  switch (signal.kind) {
    case "regex":
      full = matches(signal.patterns, text);
      break;
    case "minWords":
      full = words >= (signal.min ?? 0);
      break;
    case "specifics":
      full = hasSpecifics(text);
      break;
    case "focus": {
      const n = distinctVerbs(text);
      full = n >= 1 && n <= (signal.max ?? 2);
      break;
    }
  }
  if (full) return signal.points;
  const partial = signal.partial;
  if (partial) {
    if (partial.min !== undefined && words >= partial.min) return partial.points;
    if (matches(partial.patterns, text)) return partial.points;
  }
  return 0;
}

function vaguePenalty(text: string): number {
  const found = text.toLowerCase().match(new RegExp(VAGUE.pattern, "gi")) ?? [];
  const distinct = new Set(found.map((w) => w.toLowerCase())).size;
  return Math.min(VAGUE.maxOff, distinct * VAGUE.pointsOff);
}

function listed(labels: string[]): string {
  const shown = labels.slice(0, MAX_LISTED).join(", ");
  const more = labels.length - MAX_LISTED;
  return more > 0 ? `${shown} and ${more} more` : shown;
}

function describe(dimension: DimKey, hits: Hit[], penalty: number): DimensionScore {
  const rows = hits.filter((h) => h.signal.dimension === dimension);
  const raw = rows.reduce((sum, h) => sum + h.earned, 0);
  const off = dimension === "clarity" ? Math.min(penalty, raw) : 0;
  const score = Math.min(LIMITS.maxScore, Math.max(0, raw - off));

  const found = rows.filter((h) => h.earned > 0).map((h) => h.signal.label);
  const missing = rows.filter((h) => h.earned === 0).map((h) => h.signal.label);
  const parts: string[] = [];
  if (found.length) parts.push(`Has ${listed(found)}.`);
  if (missing.length) parts.push(`Missing ${listed(missing)}.`);
  if (off > 0) parts.push("Vague words such as 'something' or 'good' cost a point.");

  const gaps = rows.filter((h) => h.earned < h.signal.points).sort((a, b) => b.signal.points - a.signal.points);
  let fix = gaps[0]?.signal.fix ?? "Nothing to add here. Keep this part as it is.";
  if (off > 0 && !gaps.length) fix = "Swap vague words for the specific thing you mean.";

  return { score, reason: parts.join(" ") || "Nothing found.", fix };
}

function labelOf(line: string): string {
  return line.split(":")[0].trim().toLowerCase();
}

function improve(prompt: string, hits: Hit[]): string {
  const existing = new Set(
    prompt
      .split("\n")
      .filter((l) => l.includes(":"))
      .map(labelOf),
  );
  const order = DIMENSIONS.map((d) => d.key);
  const additions = hits
    .filter((h) => h.earned === 0 && h.signal.rewrite && !existing.has(labelOf(h.signal.rewrite)))
    .sort((a, b) => b.signal.points - a.signal.points)
    .slice(0, MAX_REWRITE_LINES)
    .sort((a, b) => order.indexOf(a.signal.dimension) - order.indexOf(b.signal.dimension))
    .map((h) => h.signal.rewrite as string);
  return additions.length ? `${prompt.trim()}\n\n${additions.join("\n")}` : prompt.trim();
}

/** Scores a prompt with the written rules. Same prompt in, same scorecard out. */
export function quickCheck(prompt: string): Scorecard {
  const clean = stripPlaceholders(prompt);
  const words = wordCount(clean);
  const hits: Hit[] = SIGNALS.map((signal) => ({ signal, earned: earnedFor(signal, clean, words) }));
  const penalty = vaguePenalty(clean);

  const dimensions = {} as Record<DimKey, DimensionScore>;
  let total = 0;
  for (const d of DIMENSIONS) {
    dimensions[d.key] = describe(d.key, hits, penalty);
    total += dimensions[d.key].score;
  }

  const ranked = DIMENSIONS.map((d) => ({ name: d.name, score: dimensions[d.key].score }));
  const best = ranked.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = ranked.reduce((a, b) => (b.score < a.score ? b : a));
  const summary =
    best.name === worst.name
      ? `All four inputs score ${best.score} out of ${LIMITS.maxScore}.`
      : `Strongest input: ${best.name} (${best.score} of ${LIMITS.maxScore}). Weakest input: ${worst.name} (${worst.score} of ${LIMITS.maxScore}), so start there.`;

  return {
    engine: "quick",
    dimensions,
    summary,
    improvedPrompt: improve(prompt, hits),
    total,
    max: DIMENSIONS.length * LIMITS.maxScore,
    band: bandFor(total),
  };
}
