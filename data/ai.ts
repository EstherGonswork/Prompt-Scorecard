/**
 * Settings and messages for the AI review. Edit this file to add a model or reword an error.
 * The visitor's key goes only to the endpoint below.
 */

export const AI = {
  endpoint: "https://api.anthropic.com/v1/messages",
  version: "2023-06-01",
  maxTokens: 1200,
  timeoutMs: 60_000,
  keyPrefix: "sk-ant-",
  consoleUrl: "https://console.anthropic.com/settings/keys",
};

export const MODELS = [
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (fastest, lowest cost)" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (more careful, higher cost)" },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const AI_ERRORS = {
  noKey: "Add your Anthropic API key to use the AI review.",
  badKeyShape: "That does not look like an Anthropic key. Keys start with sk-ant-.",
  key: "Anthropic did not accept this key. Check that it is copied in full and still active.",
  limit: "The key has reached a rate limit or has no credit left. Wait a minute or check the balance in the Anthropic console.",
  busy: "Anthropic is busy right now. Try again in a moment.",
  network: "The request did not reach Anthropic. Check the connection and try again.",
  model: "Anthropic could not find that model. Pick another model and try again.",
  bad: "The AI reply could not be read. Try again, or use the Quick check.",
};
