"use client";

import { useEffect, useRef, useState } from "react";
import { AI_ERRORS, DEFAULT_MODEL, MODELS } from "@/data/ai";
import { COPY } from "@/data/copy";
import { DIMENSIONS, LIMITS, SCORE_GUIDE } from "@/data/rubric";
import { SAMPLES } from "@/data/samples";
import { AiReviewError, reviewWithAi } from "@/lib/aiReview";
import { clearKey, loadKey, loadModel, saveKey, saveModel } from "@/lib/keyStore";
import { quickCheck } from "@/lib/quickCheck";
import type { Engine, Scorecard as ScorecardData } from "@/lib/scorecard";
import { KeyPanel } from "./KeyPanel";
import { ModeSwitch } from "./ModeSwitch";
import { Results } from "./Results";

type Status = "idle" | "loading" | "error" | "done";

export function Scorecard() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Engine>("quick");
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<ScorecardData | null>(null);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [previousTotal, setPreviousTotal] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelect = useRef(false);

  const busy = status === "loading";
  const tooShort = prompt.trim().length < LIMITS.minChars;
  const needsKey = mode === "ai" && apiKey.trim() === "";

  // Read any saved key and model once the page is in the browser.
  useEffect(() => {
    const saved = loadKey();
    if (saved) {
      setApiKey(saved);
      setRemember(true);
    }
    const savedModel = loadModel();
    if (savedModel && MODELS.some((m) => m.id === savedModel)) setModel(savedModel);
  }, []);

  // Keep the saved key in step with the tick box and the field.
  useEffect(() => {
    if (remember && apiKey) saveKey(apiKey);
    if (!remember) clearKey();
  }, [remember, apiKey]);

  // Move focus to the new results so keyboard and screen reader users land on them.
  useEffect(() => {
    if (status === "done" && card) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, [status, card]);

  // After the improved prompt loads, select its first [bracket] so typing replaces it.
  useEffect(() => {
    if (!pendingSelect.current) return;
    pendingSelect.current = false;
    const el = promptRef.current;
    if (!el) return;
    el.focus();
    const start = el.value.indexOf("[");
    const end = start >= 0 ? el.value.indexOf("]", start) : -1;
    if (start >= 0 && end > start) el.setSelectionRange(start, end + 1);
  }, [prompt]);

  async function run() {
    if (busy) return;
    const text = prompt.trim();
    setError(null);
    if (mode === "quick") {
      setCard(quickCheck(text));
      setPreviousTotal(baseline);
      setBaseline(null);
      setStatus("done");
      return;
    }
    setStatus("loading");
    try {
      const result = await reviewWithAi(text, apiKey, model);
      setCard(result);
      setPreviousTotal(baseline);
      setBaseline(null);
      setStatus("done");
    } catch (e) {
      setError(e instanceof AiReviewError ? e.message : AI_ERRORS.bad);
      setStatus("error");
    }
  }

  function useImproved() {
    if (!card) return;
    pendingSelect.current = true;
    setBaseline(card.total);
    setPrompt(card.improvedPrompt);
  }

  function changeModel(id: string) {
    setModel(id);
    saveModel(id);
  }

  function forgetKey() {
    setApiKey("");
    setRemember(false);
    clearKey();
  }

  return (
    <div className="shell">
      <header className="top">
        <p className="eyebrow">Prompt tool</p>
        <h1>{COPY.title}</h1>
        <p className="tagline">{COPY.tagline}</p>
      </header>

      <section className="panel input-panel">
        <ModeSwitch mode={mode} onChange={setMode} disabled={busy} />
        {mode === "ai" && (
          <KeyPanel
            apiKey={apiKey}
            onKey={setApiKey}
            remember={remember}
            onRemember={setRemember}
            model={model}
            onModel={changeModel}
            onForget={forgetKey}
            disabled={busy}
          />
        )}

        <label htmlFor="prompt">{COPY.inputLabel}</label>
        <textarea
          id="prompt"
          ref={promptRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={COPY.inputPlaceholder}
          maxLength={LIMITS.maxChars}
          rows={7}
        />
        <div className="input-meta">
          <div className="samples" role="group" aria-label="Try a sample prompt">
            <span>Try a sample:</span>
            {SAMPLES.map((s) => (
              <button key={s.label} type="button" className="chip" onClick={() => setPrompt(s.prompt)}>
                {s.label}
              </button>
            ))}
          </div>
          <span className="count">
            {prompt.length}/{LIMITS.maxChars}
          </span>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" disabled={busy || tooShort || needsKey} onClick={run}>
            {busy ? COPY.buttonBusy : COPY.button}
          </button>
          {needsKey && <span className="note">Add your key above to run the AI review.</span>}
          {!needsKey && tooShort && prompt.length > 0 && (
            <span className="note">Add a little more so there is something to score.</span>
          )}
        </div>
        {status === "error" && error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      <div aria-live="polite">
        {card && status !== "error" && (
          <Results ref={headingRef} card={card} previousTotal={previousTotal} onUseImproved={useImproved} />
        )}
      </div>

      <details className="panel how">
        <summary>How the scoring works</summary>
        <ul>
          {DIMENSIONS.map((d) => (
            <li key={d.key}>
              <strong>{d.name}.</strong> {d.question} A 9 or 10 {d.high.charAt(0).toLowerCase()}
              {d.high.slice(1)}
            </li>
          ))}
        </ul>
        <p className="guide">{SCORE_GUIDE.map((g) => `${g.range}: ${g.meaning}`).join(" · ")}</p>
        <p className="guide">
          The Quick check looks for named signals in the text, such as an audience, a tone, a length or a list of things to
          avoid. Each signal earns points, and the rules sit in one data file you can edit. The AI review sends the same
          rubric to Claude and returns scores with reasons.
        </p>
      </details>

      <footer className="foot">{COPY.footer}</footer>
    </div>
  );
}
