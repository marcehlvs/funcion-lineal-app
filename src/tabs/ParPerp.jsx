import { toggleHelp } from "../helpGate";
import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import Plano from "../components/Plano.jsx";
import { LineAnswer, Legend } from "../components/ui.jsx";
import { genParPerp } from "../math/generators.js";
import { eq, format, paren, toNumber, neg, div, ONE, isZero } from "../math/fraction.js";
import { formatLine, parseLineAnswer, passesThrough, equal, emptyLineAnswer } from "../math/line.js";
import { useSolveOnce } from "../hooks.js";

const COLORS = { ref: "#3B6FB5", par: "#3E9A6E", perp: "#D9822B" };

export default function ParPerp({ onSolved }) {
  const [n, setN] = useState(0);
  return <Ejercicio key={n} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

/** Devuelve null si la respuesta es correcta, o un mensaje que explica qué falló. */
function explain(kind, parsed, ex) {
  const target = kind === "par" ? ex.par : ex.perp;
  if (parsed === null) return "Completá los casilleros con números (enteros, decimales o fracciones como 3/2).";
  if (equal(parsed, target)) return null;

  if (target.kind === "vertical" && parsed.kind !== "vertical") {
    return "La recta dada es horizontal, así que la perpendicular es vertical: tocá «es vertical» y escribí x = ...";
  }
  if (parsed.kind === "vertical") return "Esta recta no es vertical: tiene pendiente.";

  const throughP = passesThrough(parsed, ex.p);
  if (target.kind === "vertical") return "Tiene que ser vertical y pasar por P: su x es el x de P.";
  const rightSlope = eq(parsed.m, target.m);

  // el error más típico: usar para la perpendicular la pendiente de la paralela
  if (kind === "perp" && eq(parsed.m, ex.line.m)) return "Esa es la pendiente de la paralela. Para la perpendicular usá −1/m.";

  if (rightSlope && !throughP) return "La pendiente está bien, pero la recta no pasa por P. Recalculá la ordenada: b = y₀ − m·x₀.";
  if (throughP && !rightSlope) {
    return kind === "par"
      ? "Pasa por P, pero no es paralela: tiene que tener la misma pendiente que la recta dada."
      : "Pasa por P, pero no es perpendicular: la pendiente tiene que ser −1/m (la inversa cambiada de signo).";
  }
  return kind === "par" ? "Revisá la pendiente y la ordenada." : "Recordá: m⊥ = −1/m, y después b = y₀ − m⊥·x₀.";
}

function Ejercicio({ onNext, onSolved }) {
  const [ex] = useState(() => genParPerp());
  const markSolved = useSolveOnce(onSolved);
  const [par, setPar] = useState(emptyLineAnswer);
  const [perp, setPerp] = useState(emptyLineAnswer);
  const [checked, setChecked] = useState(false);
  const [showDev, setShowDev] = useState(false);

  const parMsg = checked ? explain("par", parseLineAnswer(par), ex) : null;
  const perpMsg = checked ? explain("perp", parseLineAnswer(perp), ex) : null;
  const parOk = checked && parMsg === null;
  const perpOk = checked && perpMsg === null;

  const check = () => {
    setChecked(true);
    if (explain("par", parseLineAnswer(par), ex) === null && explain("perp", parseLineAnswer(perp), ex) === null) markSolved();
  };
  const edit = (setter) => (v) => { setter(v); setChecked(false); };

  const horizontal = ex.line.kind === "fn" && isZero(ex.line.m);
  const mPerp = horizontal ? null : neg(div(ONE, ex.line.m));

  const lines = [{ line: ex.line, color: COLORS.ref }];
  if (parOk) lines.push({ line: ex.par, color: COLORS.par, dashed: true });
  if (perpOk) lines.push({ line: ex.perp, color: COLORS.perp, dashed: true });
  const legend = [{ color: COLORS.ref, label: `dada: ${formatLine(ex.line)}` }];
  if (parOk) legend.push({ color: COLORS.par, label: "paralela", dashed: true });
  if (perpOk) legend.push({ color: COLORS.perp, label: "perpendicular", dashed: true });

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Paralela y perpendicular por un punto</h3>
          <p className="ex-prompt">
            Dada la recta y el punto <strong>P = ({format(ex.p.x)}, {format(ex.p.y)})</strong>, hallá la recta
            <strong> paralela</strong> y la <strong>perpendicular</strong> que pasan por P.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}><RotateCcw size={14} /> otro ejercicio</button>
      </div>

      <div className="eq-big" style={{ color: COLORS.ref }}>{formatLine(ex.line)}</div>

      <div className="answer-row">
        <span className="answer-row__label" style={{ color: COLORS.par }}>Paralela por P:</span>
        <LineAnswer value={par} onChange={edit(setPar)} state={checked ? (parOk ? "ok" : "bad") : undefined} />
      </div>
      {parMsg && <p className="feedback feedback--bad">Paralela: {parMsg}</p>}

      <div className="answer-row">
        <span className="answer-row__label" style={{ color: COLORS.perp }}>Perpendicular por P:</span>
        <LineAnswer value={perp} onChange={edit(setPerp)} state={checked ? (perpOk ? "ok" : "bad") : undefined} />
      </div>
      {perpMsg && <p className="feedback feedback--bad">Perpendicular: {perpMsg}</p>}

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={check}>Verificar</button>
        <button className="btn btn--ghost" onClick={() => toggleHelp(showDev, setShowDev)}>
          {showDev ? <EyeOff size={14} /> : <Eye size={14} />} {showDev ? "ocultar desarrollo" : "ver desarrollo"}
        </button>
      </div>

      {parOk && perpOk && <p className="feedback feedback--ok">¡Las dos están perfectas! Mirá cómo se cruzan formando ángulo recto.</p>}

      {showDev && (
        <div className="hand-calc">
          <p className="hc-title">Paralela: misma pendiente</p>
          <p>m∥ = m = <strong>{format(ex.line.m)}</strong></p>
          <p className="hc-formula">Pasa por P(x₀, y₀) → b = y₀ − m·x₀</p>
          <p>b = {format(ex.p.y)} − {paren(ex.line.m)} · {paren(ex.p.x)} = <strong>{format(ex.par.b)}</strong> → <strong>{formatLine(ex.par)}</strong></p>

          <p className="hc-title">Perpendicular: pendiente opuesta e inversa</p>
          {horizontal ? (
            <>
              <p>La recta dada es horizontal (m = 0): no existe −1/0.</p>
              <p>La perpendicular es <strong>vertical</strong> y pasa por P → <strong>{formatLine(ex.perp)}</strong></p>
              <p className="hc-note">Una recta vertical no es función.</p>
            </>
          ) : (
            <>
              <p className="hc-formula">m⊥ = −1 / m</p>
              <p>m⊥ = −1 / {paren(ex.line.m)} = <strong>{format(mPerp)}</strong> (y m · m⊥ = {format(ex.line.m)} · {paren(mPerp)} = −1)</p>
              <p>b = {format(ex.p.y)} − {paren(mPerp)} · {paren(ex.p.x)} = <strong>{format(ex.perp.b)}</strong> → <strong>{formatLine(ex.perp)}</strong></p>
            </>
          )}
        </div>
      )}

      <Plano
        lines={lines}
        points={[{ id: "p", x: toNumber(ex.p.x), y: toNumber(ex.p.y), color: "#1F3A34", label: `P(${format(ex.p.x)}, ${format(ex.p.y)})` }]}
        label="Recta dada y punto P"
      />
      <Legend items={legend} />

      {parOk && perpOk && (
        <div className="ex-actions">
          <button className="btn btn--primary" onClick={onNext}>Siguiente</button>
        </div>
      )}
    </div>
  );
}
