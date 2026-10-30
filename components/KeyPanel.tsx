import { AI, MODELS } from "@/data/ai";
import { COPY } from "@/data/copy";

interface Props {
  apiKey: string;
  onKey: (value: string) => void;
  remember: boolean;
  onRemember: (value: boolean) => void;
  model: string;
  onModel: (id: string) => void;
  onForget: () => void;
  disabled: boolean;
}

export function KeyPanel({ apiKey, onKey, remember, onRemember, model, onModel, onForget, disabled }: Props) {
  const k = COPY.keyPanel;
  return (
    <div className="key-panel">
      <div className="key-row">
        <div className="field">
          <label htmlFor="api-key">{k.label}</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => onKey(e.target.value)}
            placeholder={k.placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={disabled}
          />
        </div>
        <div className="field">
          <label htmlFor="model">{k.modelLabel}</label>
          <select id="model" value={model} onChange={(e) => onModel(e.target.value)} disabled={disabled}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="key-actions">
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => onRemember(e.target.checked)} disabled={disabled} />
          {k.remember}
        </label>
        <button type="button" className="btn ghost small" onClick={onForget} disabled={disabled || (!apiKey && !remember)}>
          {k.forget}
        </button>
        <a href={AI.consoleUrl} target="_blank" rel="noopener noreferrer" className="link">
          {k.getKey}
        </a>
      </div>
      <p className="warn">{k.warning}</p>
    </div>
  );
}
