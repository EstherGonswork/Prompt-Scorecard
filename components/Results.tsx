import { forwardRef } from "react";
import { DIMENSIONS, LIMITS } from "@/data/rubric";
import { COPY } from "@/data/copy";
import { countPlaceholders } from "@/lib/text";
import type { Scorecard } from "@/lib/scorecard";
import { CopyButton } from "./CopyButton";
import { ScoreBar } from "./ScoreBar";

interface Props {
  card: Scorecard;
  previousTotal: number | null;
  onUseImproved: () => void;
}

export const Results = forwardRef<HTMLHeadingElement, Props>(function Results(
  { card, previousTotal, onUseImproved },
  headingRef,
) {
  const delta = previousTotal === null ? null : card.total - previousTotal;
  const unfilled = countPlaceholders(card.improvedPrompt);

  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="panel overall">
        <div>
          <h2 id="results-heading" ref={headingRef} tabIndex={-1}>
            Your scorecard
          </h2>
          <span className={`tag ${card.engine}`}>{COPY.modes[card.engine].name}</span>
          <p className="summary">{card.summary}</p>
        </div>
        <div className="total" aria-label={`Total ${card.total} out of ${card.max}, ${card.band}`}>
          <span className="total-num">{card.total}</span>
          <span className="total-max">/{card.max}</span>
          <span className="band">{card.band}</span>
          {delta !== null && (
            <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
              {delta === 0
                ? `No change from ${previousTotal}`
                : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} from ${previousTotal}`}
            </span>
          )}
        </div>
      </div>

      <div className="grid">
        {DIMENSIONS.map((d) => {
          const item = card.dimensions[d.key];
          return (
            <article className="panel dim" key={d.key}>
              <header>
                <h3>{d.name}</h3>
                <span className="dim-score">
                  {item.score}
                  <small>/{LIMITS.maxScore}</small>
                </span>
              </header>
              <ScoreBar score={item.score} label={d.name} />
              <p className="reason">{item.reason}</p>
              <p className="fix">
                <strong>Fix:</strong> {item.fix}
              </p>
            </article>
          );
        })}
      </div>

      <div className="panel improved">
        <h2>Improved prompt</h2>
        <p className="hint">Square brackets mark details only you can fill in.</p>
        {card.engine === "quick" && unfilled > 0 && <p className="hint unfilled">{COPY.unfilled(unfilled)}</p>}
        <pre className="improved-text">{card.improvedPrompt}</pre>
        <div className="actions">
          <CopyButton text={card.improvedPrompt} />
          <button type="button" className="btn" onClick={onUseImproved}>
            {COPY.useImproved}
          </button>
        </div>
      </div>
    </section>
  );
});
