/**
 * Rules for the Quick check. Edit this file to change how prompts are scored.
 * No interface code needs to change.
 *
 * Each signal is something a good prompt usually contains. A signal earns its points when it is
 * found in the prompt, earns partial points when a weaker form is found, and earns nothing when
 * it is missing. The points of the signals in each input add up to 10.
 */

import type { DimKey } from "@/data/rubric";

export type SignalKind = "regex" | "minWords" | "specifics" | "focus";

export interface Signal {
  id: string;
  dimension: DimKey;
  points: number;
  kind: SignalKind;
  /** Short noun phrase used in the reason, for example "a named audience". */
  label: string;
  /** One sentence shown when the signal is missing. */
  fix: string;
  /** A line added to the improved prompt when the signal is missing. The text before the colon is its label. */
  rewrite?: string;
  /** regex kind: the signal is found when any pattern matches. */
  patterns?: RegExp[];
  /** minWords kind: words needed for full points. */
  min?: number;
  /** focus kind: most distinct action verbs allowed. */
  max?: number;
  /** A weaker form that earns fewer points. */
  partial?: { points: number; patterns?: RegExp[]; min?: number };
}

const ACTION_VERBS = [
  "write", "draft", "create", "generate", "summarise", "summarize", "explain", "list", "compare",
  "build", "design", "analyse", "analyze", "translate", "review", "rewrite", "plan", "outline",
  "suggest", "produce", "prepare", "compose", "develop", "describe", "calculate", "convert", "edit",
  "proofread", "brainstorm", "recommend", "extract", "classify",
];

/** Matches any action verb. Build a fresh RegExp from the source before using it with the g flag. */
export const ACTION_VERB_SOURCE = `\\b(${ACTION_VERBS.join("|")})\\b`;

const DELIVERABLES = [
  "blog post", "post", "email", "e-mail", "summary", "report", "table", "script", "essay", "checklist",
  "outline", "headline", "caption", "plan", "analysis", "code", "function", "brief", "proposal", "story",
  "poem", "article", "press release", "faq", "slides?", "deck", "presentation", "itinerary", "recipe",
  "letter", "newsletter", "tagline", "slogan", "review", "guide", "tutorial", "case study", "whitepaper",
  "white paper", "bio", "description", "list", "comparison", "agenda", "spreadsheet", "query", "message",
  "tweet", "thread", "pitch", "speech", "lesson", "quiz",
];

const AUDIENCE_WORDS = [
  "audience", "readers?", "buyers?", "managers?", "customers?", "clients?", "users?", "students?",
  "beginners?", "professionals?", "executives?", "teams?", "engineers?", "developers?", "founders?",
  "investors?", "parents?", "teachers?", "marketers?", "recruiters?", "stakeholders?", "members?",
  "shoppers?", "visitors?", "procurement", "aimed at", "targeted at",
];

const TONE_WORDS = [
  "calm", "friendly", "formal", "casual", "witty", "authoritative", "warm", "expert", "playful",
  "professional", "conversational", "persuasive", "bold", "empathetic", "confident", "humorous",
  "serious", "inspiring", "upbeat", "neutral", "direct", "tone", "voice", "style", "register",
];

const FORMAT_WORDS = [
  "bullets?", "bulleted", "table", "headings?", "h[1-6]", "numbered", "checklist", "json", "markdown",
  "sections?", "steps?", "outline", "paragraphs?", "format", "template", "subheadings?", "csv",
  "intro(duction)?", "conclusion", "tl;dr", "faq",
];

const units =
  "words?|sentences?|paragraphs?|bullets?|points?|items?|characters?|minutes?|slides?|pages?|lines?|sections?|steps?|tips?|examples?|ideas?";
const numbers = "\\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|fifty|hundred";

export const SIGNALS: Signal[] = [
  // Clarity: what exactly must be produced (10 points)
  {
    id: "verb", dimension: "clarity", points: 2, kind: "regex", label: "an action verb",
    fix: "Start with a clear action verb such as write, summarise or compare.",
    rewrite: "Task: [what you want the AI to do]",
    patterns: [new RegExp(ACTION_VERB_SOURCE, "i")],
  },
  {
    id: "deliverable", dimension: "clarity", points: 2, kind: "regex", label: "a named deliverable",
    fix: "Name the output, for example a blog post, email, table or checklist.",
    rewrite: "Deliverable: [the type of output you want]",
    patterns: [new RegExp(`\\b(${DELIVERABLES.join("|")})\\b`, "i")],
  },
  {
    id: "detail", dimension: "clarity", points: 3, kind: "minWords", min: 18, label: "enough detail",
    fix: "Add the specifics: the topic, the scope and what the output must contain.",
    rewrite: "Details: [topic, scope and what must be included]",
    partial: { points: 1, min: 8 },
  },
  {
    id: "specifics", dimension: "clarity", points: 1, kind: "specifics", label: "specific details",
    fix: "Add concrete specifics such as numbers, names or places.",
  },
  {
    id: "focus", dimension: "clarity", points: 1, kind: "focus", max: 2, label: "a single focused job",
    fix: "Split the prompt so each one asks for a single job.",
  },
  {
    id: "topic", dimension: "clarity", points: 1, kind: "regex", label: "a named topic",
    fix: "Say what the output is about, for example 'about supplier audits'.",
    patterns: [/\b(about|on|regarding|covering|concerning|for)\s+\w+/i],
  },

  // Context: why it matters and where it will live (10 points)
  {
    id: "audience", dimension: "context", points: 3, kind: "regex", label: "a named audience",
    fix: "Say who will read or use the output.",
    rewrite: "Audience: [who will read or use this]",
    patterns: [new RegExp(`\\b(${AUDIENCE_WORDS.join("|")})\\b`, "i")],
  },
  {
    id: "purpose", dimension: "context", points: 3, kind: "regex", label: "a purpose",
    fix: "Explain what the output should achieve or help the reader do.",
    rewrite: "Purpose: [what the output should help the reader do]",
    patterns: [
      /\b(so that|so they|so readers|so the reader|to help|helps?|helping|in order to|goal|aims?|aimed|purpose|objective)\b/i,
      /\bto (persuade|convince|inform|educate|sell|teach|guide|encourage|reassure)\b/i,
    ],
  },
  {
    id: "channel", dimension: "context", points: 2, kind: "regex", label: "where it will be used",
    fix: "Say where the output will appear, such as a website, email or deck.",
    rewrite: "Where it will be used: [website, email, deck or other channel]",
    patterns: [
      /\bwill (be )?(sit|live|appear|published|posted|used|sent|shown|shared|read|go)\b/i,
      /\b(publish(ed)?|post(ed)?) (on|in|to)\b/i,
      /\b(on|in|for) (our|my|the) (company |brand )?(website|blog|newsletter|platform|site|app|intranet|channel|page|linkedin|deck|report)\b/i,
    ],
  },
  {
    id: "background", dimension: "context", points: 2, kind: "regex", label: "background on the situation",
    fix: "Add one or two sentences about your situation or the reader's.",
    rewrite: "Background: [one or two sentences on the situation]",
    patterns: [
      /\b(i am|i'm|we are|we're|we have|our (company|team|business|brand|product)|my (company|team|business|role)|who (are|is|have|has)|currently|because|background|context)\b/i,
    ],
  },

  // Creativity: tone, angle and imaginative direction (10 points)
  {
    id: "tone", dimension: "creativity", points: 4, kind: "regex", label: "a tone or voice",
    fix: "Set the tone or voice, for example calm and expert, friendly or formal.",
    rewrite: "Tone: [for example calm and expert, friendly or formal]",
    patterns: [new RegExp(`\\b(${TONE_WORDS.join("|")})\\b`, "i")],
    partial: { points: 2, patterns: [/\b(practical|simple|clear|concise|plain|brief|short)\b/i] },
  },
  {
    id: "angle", dimension: "creativity", points: 3, kind: "regex", label: "an angle or example",
    fix: "Give an angle, a persona or one example to build around.",
    rewrite: "Angle or example: [a hook, persona or example to build around]",
    patterns: [
      /\b(angle|perspective|point of view|narrative|metaphor|analogy|anecdote|case study|hook|real-world|story|persona|act as|example|opening|start with|begin with|open with)\b/i,
      /\byou are (a|an)\b/i,
    ],
  },
  {
    id: "reference", dimension: "creativity", points: 3, kind: "regex", label: "a style reference",
    fix: "Point to a style to follow, such as 'in the style of ...' or a sample.",
    rewrite: "Style to follow: [a sample or a publication to imitate]",
    patterns: [/\b(in the style of|like (a|an|the)|similar to|such as|for example|e\.g\.|inspired by|modell?ed on|reminiscent)\b/i],
  },

  // Constraints: format limits, structure and exclusions (10 points)
  {
    id: "length", dimension: "constraints", points: 3, kind: "regex", label: "a length limit",
    fix: "Set a length, such as a word count or a number of items.",
    rewrite: "Length: [word count or number of items]",
    patterns: [new RegExp(`\\b(${numbers})[-\\s]?(${units})\\b`, "i")],
    partial: { points: 1, patterns: [/\b(short|brief|concise|one paragraph|a paragraph|one page|a few sentences|long-form)\b/i] },
  },
  {
    id: "format", dimension: "constraints", points: 3, kind: "regex", label: "a format or structure",
    fix: "Specify the format, such as headings, bullets, a table or numbered steps.",
    rewrite: "Format: [headings, bullets, table or other structure]",
    patterns: [new RegExp(`\\b(${FORMAT_WORDS.join("|")})`, "i")],
  },
  {
    id: "exclusions", dimension: "constraints", points: 3, kind: "regex", label: "things to avoid",
    fix: "List what to leave out, such as jargon, hype or named brands.",
    rewrite: "Avoid: [words, topics or claims to leave out]",
    patterns: [
      /\b(avoid|don'?t|do not|never|without|exclude|excluding|must not|steer clear|leave out|no (jargon|fluff|hype|clich[eé]s|buzzwords))\b/i,
    ],
  },
  {
    id: "requirements", dimension: "constraints", points: 1, kind: "regex", label: "must-have items",
    fix: "State anything the output must include.",
    rewrite: "Must include: [required points or sections]",
    patterns: [/\b(include|including|must|should|ensure|make sure|cite|end with|close with|finish with|add a|each|every)\b/i],
  },
];

/** Vague words take points off Clarity. */
export const VAGUE = {
  pattern: "\\b(something|stuff|things?|good|nice|interesting|great|whatever|anything)\\b",
  pointsOff: 1,
  maxOff: 2,
};

/** Most lines added to the improved prompt. */
export const MAX_REWRITE_LINES = 5;
