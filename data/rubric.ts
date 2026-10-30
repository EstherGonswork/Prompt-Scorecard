/**
 * The scoring rubric. The page shows it and the AI reviewer is told to follow it.
 * To change what counts as a good prompt, edit this file only.
 */

export type DimKey = "clarity" | "context" | "creativity" | "constraints";

export interface Dimension {
  key: DimKey;
  name: string;
  /** The question the reviewer asks of the prompt. */
  question: string;
  /** What a score of 9 or 10 looks like. */
  high: string;
  /** What a score of 0 to 2 looks like. */
  low: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: "clarity",
    name: "Clarity",
    question: "Does the prompt say exactly what must be produced?",
    high: "Names the deliverable, its type and the single job to be done.",
    low: "A vague ask such as 'write something about X', or several jobs mixed together.",
  },
  {
    key: "context",
    name: "Context",
    question: "Does it explain why the output matters and where it will be used?",
    high: "Names the audience, the purpose and where the result will live.",
    low: "No audience, no purpose and no background.",
  },
  {
    key: "creativity",
    name: "Creativity",
    question: "Does it set the tone, angle or imaginative direction?",
    high: "Specifies voice, angle or style, ideally with an example to follow.",
    low: "Leaves tone and angle entirely to the model.",
  },
  {
    key: "constraints",
    name: "Constraints",
    question: "Does it set format limits, length, structure and exclusions?",
    high: "Gives length, format, structure and the things to avoid.",
    low: "No limits at all, so the output is open-ended.",
  },
];

export const SCORE_GUIDE = [
  { range: "0 to 2", meaning: "Missing" },
  { range: "3 to 4", meaning: "Hinted at" },
  { range: "5 to 6", meaning: "Partly covered" },
  { range: "7 to 8", meaning: "Well covered" },
  { range: "9 to 10", meaning: "Complete, with specifics" },
];

/** Overall bands, based on the total out of 40. */
export const BANDS = [
  { min: 33, label: "Excellent" },
  { min: 25, label: "Solid" },
  { min: 15, label: "Getting there" },
  { min: 0, label: "Needs work" },
];

export const LIMITS = {
  minChars: 15,
  maxChars: 4000,
  maxScore: 10,
};
