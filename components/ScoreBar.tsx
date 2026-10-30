import { LIMITS } from "@/data/rubric";

/** A bar with the number beside it, so the score never depends on color only. */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  const tone = score >= 8 ? "high" : score >= 5 ? "mid" : "low";
  return (
    <div className="bar" role="img" aria-label={`${label}: ${score} out of ${LIMITS.maxScore}`}>
      <div className="bar-track">
        <div className={`bar-fill ${tone}`} style={{ width: `${(score / LIMITS.maxScore) * 100}%` }} />
      </div>
    </div>
  );
}
