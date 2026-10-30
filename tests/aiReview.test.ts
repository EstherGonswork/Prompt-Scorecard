import { describe, expect, it, vi } from "vitest";
import { AI } from "@/data/ai";
import { AiReviewError, reviewWithAi } from "@/lib/aiReview";
import { TOOL_NAME } from "@/lib/promptBuilder";

const KEY = "sk-ant-test-123";
const input = {
  clarity: { score: 7.4, reason: "Clear ask.", fix: "Name the output." },
  context: { score: 4, reason: "No audience.", fix: "Add the reader." },
  creativity: { score: 3, reason: "No tone.", fix: "Set a tone." },
  constraints: { score: 12, reason: "Has limits.", fix: "Add exclusions." },
  summary: "Good ask, thin context.",
  improvedPrompt: "Write a 600 word post for [audience].",
};
const ok = (content: unknown[] = [{ type: "tool_use", name: TOOL_NAME, input }], stop = "tool_use") =>
  new Response(JSON.stringify({ stop_reason: stop, content }), { status: 200 });
const fail = (status: number, message = "x") => new Response(JSON.stringify({ error: { message } }), { status });

describe("reviewWithAi", () => {
  it("sends the expected request", async () => {
    const f = vi.fn().mockResolvedValue(ok());
    await reviewWithAi("Write a post", KEY, "claude-haiku-5-5", f);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(AI.endpoint);
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe(KEY);
    expect(init.headers["anthropic-version"]).toBe(AI.version);
    expect(init.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("claude-haiku-5-5");
    expect(body.tool_choice).toEqual({ type: "tool", name: TOOL_NAME });
    expect(body.messages[0].content).toContain("<prompt_to_score>");
    expect(JSON.stringify(body)).not.toContain(KEY);
  });

  it("returns a normalised scorecard", async () => {
    const card = await reviewWithAi("p", KEY, "m", vi.fn().mockResolvedValue(ok()));
    expect(card.engine).toBe("ai");
    expect(card.dimensions.clarity.score).toBe(7);
    expect(card.dimensions.constraints.score).toBe(10);
    expect(card.total).toBe(24);
    expect(card.band).toBe("Getting there");
  });

  it("rejects a missing or oddly shaped key before any request", async () => {
    const f = vi.fn();
    await expect(reviewWithAi("p", "  ", "m", f)).rejects.toMatchObject({ kind: "key" });
    await expect(reviewWithAi("p", "hello", "m", f)).rejects.toMatchObject({ kind: "key" });
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    [401, "key"],
    [403, "key"],
    [429, "limit"],
    [529, "busy"],
    [500, "busy"],
    [404, "model"],
    [400, "bad"],
  ])("maps status %i to %s", async (status, kind) => {
    await expect(reviewWithAi("p", KEY, "m", vi.fn().mockResolvedValue(fail(status)))).rejects.toMatchObject({ kind });
  });

  it("maps a low credit balance to the limit message", async () => {
    const f = vi.fn().mockResolvedValue(fail(400, "Your credit balance is too low"));
    await expect(reviewWithAi("p", KEY, "m", f)).rejects.toMatchObject({ kind: "limit" });
  });

  it("maps a network failure", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(reviewWithAi("p", KEY, "m", f)).rejects.toMatchObject({ kind: "network" });
  });

  it("rejects a reply with no tool call or a cut-off reply", async () => {
    await expect(reviewWithAi("p", KEY, "m", vi.fn().mockResolvedValue(ok([{ type: "text", text: "hi" }])))).rejects.toBeInstanceOf(AiReviewError);
    await expect(reviewWithAi("p", KEY, "m", vi.fn().mockResolvedValue(ok(undefined, "max_tokens")))).rejects.toMatchObject({ kind: "bad" });
  });

  it("rejects a reply with a missing field", async () => {
    const broken = { ...input, summary: "" };
    const f = vi.fn().mockResolvedValue(ok([{ type: "tool_use", name: TOOL_NAME, input: broken }]));
    await expect(reviewWithAi("p", KEY, "m", f)).rejects.toMatchObject({ kind: "bad" });
  });

  it("does not put the key in any error message", async () => {
    try {
      await reviewWithAi("p", KEY, "m", vi.fn().mockResolvedValue(fail(401, `bad key ${KEY}`)));
    } catch (e) {
      expect((e as Error).message).not.toContain(KEY);
    }
  });
});
