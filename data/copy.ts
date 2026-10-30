export const COPY = {
  title: "Prompt Scorecard",
  tagline:
    "Paste a prompt and see how well it covers four inputs: Clarity, Context, Creativity and Constraints. You get a score for each, one fix per gap and an improved prompt to work from.",
  inputLabel: "Your prompt",
  inputPlaceholder: "Paste or type a prompt here",
  button: "Score my prompt",
  buttonBusy: "Scoring...",
  useImproved: "Use improved prompt",
  modes: {
    quick: {
      name: "Quick check",
      blurb: "Free. Runs in this browser with a set of written rules. Nothing is sent anywhere.",
    },
    ai: {
      name: "AI review",
      blurb: "Uses your own Anthropic API key. Reads the meaning of the prompt, so it catches more.",
    },
  },
  keyPanel: {
    label: "Anthropic API key",
    placeholder: "sk-ant-...",
    remember: "Remember on this device",
    forget: "Forget key",
    modelLabel: "Model",
    warning:
      "Your key stays in this browser and goes only to api.anthropic.com. Use a key with a low spend limit, and delete it in the console when you are done.",
    getKey: "Get a key in the Anthropic console",
  },
  unfilled: (n: number) =>
    n === 1
      ? "1 detail in [square brackets] still needs your input. Quick check ignores bracketed text, so the score stays the same until you fill it in."
      : `${n} details in [square brackets] still need your input. Quick check ignores bracketed text, so the score stays the same until you fill them in.`,
  footer:
    "Quick check runs entirely in your browser. AI review sends the prompt to the Anthropic API with your own key. This site stores no prompts and has no server. Scores are guidance.",
};
