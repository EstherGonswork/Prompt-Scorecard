export interface Sample {
  label: string;
  prompt: string;
}

export const SAMPLES: Sample[] = [
  {
    label: "Vague",
    prompt: "Write a blog post about steel.",
  },
  {
    label: "Partly there",
    prompt:
      "Write a 600 word blog post for procurement managers about how to compare steel suppliers in India. Keep it practical.",
  },
  {
    label: "Strong",
    prompt:
      "Write a 700 word blog post for procurement managers at mid-size European manufacturers who are considering Indian steel suppliers for the first time. The post will sit on our B2B sourcing platform and should help readers shortlist three suppliers. Use a calm, expert voice with one short real-world example near the start. Use H2 headings, end with a five-item checklist, avoid hype words, and do not name specific suppliers.",
  },
];
