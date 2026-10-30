import { COPY } from "@/data/copy";
import type { Engine } from "@/lib/scorecard";

interface Props {
  mode: Engine;
  onChange: (mode: Engine) => void;
  disabled: boolean;
}

const ORDER: Engine[] = ["quick", "ai"];

export function ModeSwitch({ mode, onChange, disabled }: Props) {
  return (
    <fieldset className="modes" disabled={disabled}>
      <legend>Scoring method</legend>
      {ORDER.map((id) => (
        <label key={id} className={`mode ${mode === id ? "on" : ""}`}>
          <input type="radio" name="mode" value={id} checked={mode === id} onChange={() => onChange(id)} />
          <span className="mode-name">{COPY.modes[id].name}</span>
          <span className="mode-blurb">{COPY.modes[id].blurb}</span>
        </label>
      ))}
    </fieldset>
  );
}
