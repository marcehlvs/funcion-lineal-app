import { Check, X } from "lucide-react";

/* Componentes chicos compartidos por todas las solapas. */

/**
 * state: "ok" | "bad" | undefined
 * hint:  se muestra como "= valor" cuando la respuesta está mal
 */
export function AnswerInput({ value, onChange, state, width = 64, suffix, hint, disabled = false, label }) {
  return (
    <span className="ans-wrap">
      <input
        type="text"
        className={`ans-input ${state === "ok" ? "ans-input--ok" : state === "bad" ? "ans-input--bad" : ""}`}
        style={{ width }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="text"
        autoComplete="off"
        aria-label={label}
        disabled={disabled}
      />
      {suffix && <span className="ans-suffix">{suffix}</span>}
      {state === "ok" && <Check size={14} className="ans-icon--ok" />}
      {state === "bad" && <X size={14} className="ans-icon--bad" />}
      {state === "bad" && hint !== undefined && <span className="ans-hint">= {hint}</span>}
    </span>
  );
}

/**
 * Campo para escribir una recta:  y = [m] x + [b]   o, si es vertical,  x = [c].
 * value = { vertical, m, b, x }  (ver emptyLineAnswer en math/line.js)
 */
export function LineAnswer({ value, onChange, state, disabled = false }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <span className="line-answer">
      {value.vertical ? (
        <>
          x =
          <AnswerInput value={value.x} onChange={(x) => set({ x })} state={state} width={60} disabled={disabled} label="valor de x" />
        </>
      ) : (
        <>
          y =
          <AnswerInput value={value.m} onChange={(m) => set({ m })} state={state} width={60} disabled={disabled} label="pendiente m" />
          x +
          <AnswerInput value={value.b} onChange={(b) => set({ b })} state={state} width={60} disabled={disabled} label="ordenada b" />
        </>
      )}
      <button
        type="button"
        className="btn btn--ghost btn--tiny"
        onClick={() => set({ vertical: !value.vertical })}
        disabled={disabled}
      >
        {value.vertical ? "no es vertical" : "es vertical (x = c)"}
      </button>
    </span>
  );
}

/** Leyenda de colores debajo del plano. items: [{ color, label, dashed }] */
export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label} className="legend__item">
          <span
            className="legend__swatch"
            style={{ background: it.dashed ? `repeating-linear-gradient(90deg, ${it.color} 0 6px, transparent 6px 10px)` : it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
