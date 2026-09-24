import { toggleHelp } from "../helpGate";
import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import Plano from "../components/Plano.jsx";
import { AnswerInput, LineAnswer, Legend } from "../components/ui.jsx";
import { genRaizOrdenada } from "../math/generators.js";
import { parseFrac, eq, toNumber, format, paren, neg, ZERO } from "../math/fraction.js";
import { pt, formatLine, parseLineAnswer, passesThrough, equal, emptyLineAnswer } from "../math/line.js";
import { useSolveOnce } from "../hooks.js";

export default function RaizOrdenada({ onSolved }) {
  const [mode, setMode] = useState("cortes");
  const [n, setN] = useState(0);
  const next = () => setN((v) => v + 1);
  const Ex = mode === "cortes" ? HallarCortes : ArmarEcuacion;
  return (
    <div>
      <div className="seg">
        <button className={`seg__btn ${mode === "cortes" ? "seg__btn--active" : ""}`} onClick={() => { setMode("cortes"); next(); }}>
          De la ecuación a los cortes
        </button>
        <button className={`seg__btn ${mode === "ecuacion" ? "seg__btn--active" : ""}`} onClick={() => { setMode("ecuacion"); next(); }}>
          De los cortes a la ecuación
        </button>
      </div>
      <Ex key={`${mode}-${n}`} onNext={next} onSolved={onSolved} />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Modo 1: dada la ecuación, hallar raíz y ordenada al origen          */
/* ---------------------------------------------------------------- */

function HallarCortes({ onNext, onSolved }) {
  const [ex] = useState(() => genRaizOrdenada());
  const markSolved = useSolveOnce(onSolved);
  const [rootStr, setRootStr] = useState("");
  const [ordStr, setOrdStr] = useState("");
  const [checked, setChecked] = useState(false);
  const [showDev, setShowDev] = useState(false);

  const rootOk = (() => { const v = parseFrac(rootStr); return v !== null && eq(v, ex.x0); })();
  const ordOk = (() => { const v = parseFrac(ordStr); return v !== null && eq(v, ex.b); })();
  const solved = checked && rootOk && ordOk;

  const check = () => {
    setChecked(true);
    if (rootOk && ordOk) markSolved();
  };
  const reset = (setter) => (v) => { setter(v); setChecked(false); };

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Raíz y ordenada al origen</h3>
          <p className="ex-prompt">
            La <strong>raíz</strong> es donde la recta corta al eje x (ahí y = 0). La <strong>ordenada al origen</strong> es
            donde corta al eje y (ahí x = 0).
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}><RotateCcw size={14} /> otra función</button>
      </div>

      <div className="eq-big">{formatLine(ex.line)}</div>

      <div className="answer-row">
        <span className="answer-row__label">Raíz (x₀, donde y = 0):</span>
        <AnswerInput value={rootStr} onChange={reset(setRootStr)} state={checked ? (rootOk ? "ok" : "bad") : undefined} width={72} label="raíz" />
      </div>
      <div className="answer-row">
        <span className="answer-row__label">Ordenada al origen (b, donde x = 0):</span>
        <AnswerInput value={ordStr} onChange={reset(setOrdStr)} state={checked ? (ordOk ? "ok" : "bad") : undefined} width={72} label="ordenada al origen" />
      </div>

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={check}>Verificar</button>
        <button className="btn btn--ghost" onClick={() => toggleHelp(showDev, setShowDev)}>
          {showDev ? <EyeOff size={14} /> : <Eye size={14} />} {showDev ? "ocultar desarrollo" : "ver desarrollo"}
        </button>
      </div>

      {checked && (
        <p className={`feedback ${solved ? "feedback--ok" : "feedback--bad"}`}>
          {solved
            ? "¡Correcto! Mirá cómo la recta pasa justo por esos dos puntos."
            : `${rootOk ? "La raíz está bien" : "Revisá la raíz"}${ordOk ? ", la ordenada está bien." : ", revisá la ordenada."} También podés leerlos del gráfico.`}
        </p>
      )}

      {showDev && (
        <div className="hand-calc">
          <p className="hc-title">Raíz: se pone y = 0 y se despeja x</p>
          <p className="hc-formula">0 = m·x + b → x = −b / m</p>
          <p>x₀ = −{paren(ex.line.b)} / {paren(ex.line.m)} = <strong>{format(ex.x0)}</strong></p>
          <p className="hc-title">Ordenada al origen: se pone x = 0</p>
          <p>y = {paren(ex.line.m)} · 0 + {paren(ex.line.b)} = <strong>{format(ex.b)}</strong>. Es el número que aparece sumando en la ecuación.</p>
        </div>
      )}

      <Plano
        lines={[{ line: ex.line, color: "#E8B33D" }]}
        points={
          solved
            ? [
                { id: "r", x: toNumber(ex.x0), y: 0, color: "#3E7A70", label: `(${format(ex.x0)}, 0)` },
                { id: "o", x: 0, y: toNumber(ex.b), color: "#B14E4E", label: `(0, ${format(ex.b)})` },
              ]
            : []
        }
        label="Gráfico de la recta"
      />
      <Legend items={[{ color: "#E8B33D", label: formatLine(ex.line) }]} />

      {solved && (
        <div className="ex-actions">
          <button className="btn btn--primary" onClick={onNext}>Siguiente</button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Modo 2: dados los cortes con los ejes, armar la ecuación            */
/* ---------------------------------------------------------------- */

function ArmarEcuacion({ onNext, onSolved }) {
  const [ex] = useState(() => genRaizOrdenada());
  const markSolved = useSolveOnce(onSolved);
  const [answer, setAnswer] = useState(emptyLineAnswer);
  const [checked, setChecked] = useState(false);
  const [showDev, setShowDev] = useState(false);

  const parsed = parseLineAnswer(answer);
  const solved = checked && parsed !== null && equal(parsed, ex.line);

  const rootPoint = pt(ex.x0, ZERO); // (x₀, 0): corta al eje x
  const ordPoint = pt(ZERO, ex.b); // (0, b): corta al eje y

  const check = () => {
    setChecked(true);
    if (parsed && equal(parsed, ex.line)) markSolved();
  };

  let message = "";
  if (checked && !solved) {
    if (parsed === null) message = "Completá los dos casilleros con números (enteros, decimales o fracciones como 3/2).";
    else if (parsed.kind === "vertical") message = "Esta recta no es vertical: corta a los dos ejes en puntos distintos.";
    else if (eq(parsed.m, ex.line.m) && !eq(parsed.b, ex.line.b)) message = `La pendiente está bien, pero la ordenada no: es donde la recta corta al eje y, o sea (0, ${format(ex.b)}).`;
    else if (!passesThrough(parsed, rootPoint) && !passesThrough(parsed, ordPoint)) message = "Tu recta no pasa por ninguno de los dos puntos.";
    else if (!passesThrough(parsed, rootPoint)) message = `Tu recta no pasa por la raíz (${format(ex.x0)}, 0). Revisá la pendiente.`;
    else if (!passesThrough(parsed, ordPoint)) message = `Tu recta no pasa por (0, ${format(ex.b)}). Revisá la ordenada.`;
    else message = "Revisá los signos.";
  }

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Armá la ecuación a partir de los cortes</h3>
          <p className="ex-prompt">
            Una recta corta al eje x en <strong>({format(ex.x0)}, 0)</strong> y al eje y en <strong>(0, {format(ex.b)})</strong>.
            Encontrá su ecuación y = m·x + b.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}><RotateCcw size={14} /> otro ejercicio</button>
      </div>

      <div className="answer-row">
        <LineAnswer value={answer} onChange={(v) => { setAnswer(v); setChecked(false); }} state={checked ? (solved ? "ok" : "bad") : undefined} />
      </div>

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={check}>Verificar</button>
        <button className="btn btn--ghost" onClick={() => toggleHelp(showDev, setShowDev)}>
          {showDev ? <EyeOff size={14} /> : <Eye size={14} />} {showDev ? "ocultar desarrollo" : "ver desarrollo"}
        </button>
      </div>

      {checked && <p className={`feedback ${solved ? "feedback--ok" : "feedback--bad"}`}>{solved ? `¡Correcto! ${formatLine(ex.line)}` : message}</p>}

      {showDev && (
        <div className="hand-calc">
          <p className="hc-title">1) La ordenada al origen ya la tenemos</p>
          <p>La recta corta al eje y en (0, {format(ex.b)}) → <strong>b = {format(ex.b)}</strong></p>
          <p className="hc-title">2) Pendiente con los dos puntos</p>
          <p className="hc-formula">m = (y₂ − y₁) / (x₂ − x₁)</p>
          <p>m = ({format(ex.b)} − 0) / (0 − {paren(ex.x0)}) = {format(ex.b)} / {format(neg(ex.x0))} = <strong>{format(ex.line.m)}</strong></p>
          <p className="hc-note">Atajo: m = −b / x₀ (menos la ordenada dividida la raíz).</p>
          <p className="hc-title">3) Ecuación</p>
          <p><strong>{formatLine(ex.line)}</strong></p>
        </div>
      )}

      <Plano
        lines={solved ? [{ line: ex.line, color: "#E8B33D" }] : []}
        points={[
          { id: "r", x: toNumber(ex.x0), y: 0, color: "#3E7A70", label: `(${format(ex.x0)}, 0)` },
          { id: "o", x: 0, y: toNumber(ex.b), color: "#B14E4E", label: `(0, ${format(ex.b)})` },
        ]}
        label="Puntos donde la recta corta a los ejes"
      />
      {solved && <Legend items={[{ color: "#E8B33D", label: formatLine(ex.line) }]} />}

      {solved && (
        <div className="ex-actions">
          <button className="btn btn--primary" onClick={onNext}>Siguiente</button>
        </div>
      )}
    </div>
  );
}
