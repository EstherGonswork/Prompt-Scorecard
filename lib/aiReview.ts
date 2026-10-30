import { AI, AI_ERRORS } from "@/data/ai";
import { buildSystemPrompt, SCORECARD_TOOL, TOOL_NAME, wrapPrompt } from "@/lib/promptBuilder";
import { normaliseScorecard, ScorecardError, type Scorecard } from "@/lib/scorecard";

export type AiErrorKind = "key" | "limit" | "busy" | "network" | "model" | "bad";

export class AiReviewError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function failFor(status: number, body: unknown): AiReviewError {
  const detail = JSON.stringify(body ?? "").toLowerCase();
  if (status === 401 || status === 403) return new AiReviewError("key", AI_ERRORS.key);
  if (status === 429) return new AiReviewError("limit", AI_ERRORS.limit);
  if (status === 400 && detail.includes("credit")) return new AiReviewError("limit", AI_ERRORS.limit);
  if (status === 404) return new AiReviewError("model", AI_ERRORS.model);
  if (status === 529 || status >= 500) return new AiReviewError("busy", AI_ERRORS.busy);
  return new AiReviewError("bad", AI_ERRORS.bad);
}

/**
 * Sends the prompt straight from the browser to the Anthropic API with the visitor's own key.
 * The key is used for this one request and is never stored here.
 */
export async function reviewWithAi(
  prompt: string,
  apiKey: string,
  model: string,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
  timeoutMs: number = AI.timeoutMs,
): Promise<Scorecard> {
  const key = apiKey.trim();
  if (!key) throw new AiReviewError("key", AI_ERRORS.noKey);
  if (!key.startsWith(AI.keyPrefix)) throw new AiReviewError("key", AI_ERRORS.badKeyShape);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetchImpl(AI.endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": AI.version,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: AI.maxTokens,
        system: buildSystemPrompt(),
        tools: [SCORECARD_TOOL],
        tool_choice: { type: "tool", name: TOOL_NAME },
        messages: [{ role: "user", content: wrapPrompt(prompt) }],
      }),
    });
  } catch {
    throw new AiReviewError("network", AI_ERRORS.network);
  } finally {
    clearTimeout(timer);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw failFor(res.status, data);

  const reply = data as { stop_reason?: string; content?: Array<{ type: string; name?: string; input?: unknown }> } | null;
  if (!reply || reply.stop_reason === "max_tokens") throw new AiReviewError("bad", AI_ERRORS.bad);
  const block = reply.content?.find((b) => b.type === "tool_use" && b.name === TOOL_NAME);
  if (!block) throw new AiReviewError("bad", AI_ERRORS.bad);

  try {
    return normaliseScorecard(block.input, "ai");
  } catch (e) {
    if (e instanceof ScorecardError) throw new AiReviewError("bad", AI_ERRORS.bad);
    throw e;
  }
}
