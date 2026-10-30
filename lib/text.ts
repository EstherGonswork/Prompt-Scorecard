const PLACEHOLDER = /\[[^\]\n]*\]/g;

/** Counts details left in [square brackets]. */
export function countPlaceholders(text: string): number {
  return (text.match(PLACEHOLDER) ?? []).length;
}

/**
 * Removes [square bracket] placeholders, then drops any line left holding only a label such as "Audience:".
 * Unfilled lines in an improved prompt therefore earn nothing until the writer fills them in.
 */
export function stripPlaceholders(text: string): string {
  return text
    .replace(PLACEHOLDER, " ")
    .split("\n")
    .filter((line) => !/^\s*[A-Za-z][A-Za-z '\-/]{0,40}:\s*$/.test(line))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function wordCount(text: string): number {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
