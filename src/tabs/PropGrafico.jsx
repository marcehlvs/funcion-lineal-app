import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import { toggleHelp } from "../helpGate";
import Plano from "../components/Plano.jsx";
import { AnswerInput, OptionPicker, Legend } from "../components/ui.jsx";
import { genGraficar, genInterpretar, hyperbolaBranches, fmt, TIPOS } from "../math/proporcionalidad.js";
import { parseFrac, eq, frac } from "../math/fraction.js";
import { fn } from "../math/line.js";
import { useSolveOnce } from "../hooks.js";

const MODOS = [
  { id: "graficar", label: "Graficá la tabla" },
  { id: "interpretar", label: "Interpretá el gráfico" },
];

export default function PropGrafico({ nivel, onSolved }) {
  const [modo, setModo] = useState("graficar");
  return (
    <div>
      <OptionPicker options={MODOS} value={modo} onChange={setModo} label="Tipo de actividad" />
      {modo === "graficar" ? <Graficar nivel={nivel} onSolved={onSolved} /> : <Interpretar nivel={nivel} onSolved={onSolved} />}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Graficá la tabla                                                    */
/* ---------------------------------------------------------------- */

function Graficar({ nivel, onSolved }) {
  const [n, setN] = useState(0);
  return <GraficarEjercicio key={n} nivel={nivel} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

function GraficarEjercicio({ nivel, onNext, onSolved }) {
  const [ex] = useState(() => genGraficar(nivel));
  const markSolved = useSolveOnce(onSolved);
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);

  const isExpected = (p) => ex.pts.some((e) => e.x === p.x && e.y === p.y);
  const wrong = placed.filter((p) => !isExpected(p));
  const missing = ex.pts.filter((e) => !placed.some((p) => p.x === e.x && p.y === e.y));
  const ok = checked && wrong.length === 0 && missing.length === 0;

  const handleClick = (p) => {
    if (ok) return;
    setChecked(false);
    setPlaced((prev) => (prev.some((q) => q.x === p.x && q.y === p.y) ? prev.filter((q) => !(q.x === p.x && q.y === p.y)) : [...prev, p]));
  };
  const check = () => {
    setChecked(true);
    if (wrong.length === 0 && missing.length === 0) markSolved();
  };

  const points = placed.map((p, i) => ({
    id: `p${i}`, x: p.x, y: p.y, label: `(${p.x}, ${p.y})`,
    color: checked && !isExpected(p) ? "#D96C6C" : "#1F3A34",
  }));

  const lines = ok && ex.tipo === "directa" ? [{ line: fn(ex.k, frac(0)), color: "#E8B33D" }] : [];
  const curves = ok && ex.tipo === "inversa"
    ? hyperbolaBranches(ex.k, !ex.positivo).map((pts) => ({ pts, color: "#E8B33D" }))
    : [];

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Representación gráfica</h3>
          <p className="ex-prompt">
            Esta tabla es de <strong>{ex.tipo === "directa" ? "proporcionalidad directa" : "proporcionalidad inversa"}</strong>.
            Ubicá en el plano todos los puntos (x, y) de la tabla.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}>
          <RotateCcw size={14} /> otra tabla
        </button>
      </div>

      <div className="table-wrap">
        <table className="val-table">
          <thead>
            <tr>
              <th>x</th>
              {ex.pts.map((p, i) => <th key={i} className="x-cell">{p.x}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>y</th>
              {ex.pts.map((p, i) => <td key={i} className="x-cell">{p.y}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="note">
        Tocá la cuadrícula para poner un punto (tocalo de nuevo para sacarlo). Puestos: {placed.length} de {ex.pts.length}.
        {ex.positivo && " Acá solo usamos x e y positivos."}
      </p>

      <Plano
        positivo={ex.positivo}
        points={points}
        lines={lines}
        curves={curves}
        onPlaneClick={ok ? undefined : handleClick}
        label="Plano para ubicar los puntos de la tabla"
      />
      {ok && <Legend items={[{ color: "#E8B33D", label: ex.tipo === "directa" ? "y = k · x" : "y = k ÷ x" }]} />}

      {!ok && (
        <div className="ex-actions">
          <button className="btn btn--primary" onClick={check} disabled={placed.length === 0}>Verificar puntos</button>
        </div>
      )}

      {checked && !ok && (
        <p className="feedback feedback--bad">
          {wrong.length > 0 && `${wrong.length} punto(s) están mal ubicados (en rojo). `}
          {missing.length > 0 && `Faltan ${missing.length} punto(s). `}
          Cada punto es (x, y): primero se avanza en x y después se sube en y.
        </p>
      )}

      {ok && (
        <>
          <p className="feedback feedback--ok">¡Perfecto!</p>
          <div className="hand-calc">
            {ex.tipo === "directa" ? (
              <>
                <p>Los puntos quedan <strong>alineados</strong> y la recta pasa por el origen (0, 0).</p>
                <p>La inclinación depende de la constante: acá k = <strong>{fmt(ex.k)}</strong> (cada vez que x aumenta 1, y aumenta {fmt(ex.k)}).</p>
              </>
            ) : (
              <>
                <p>Los puntos forman una <strong>curva</strong> (una rama de hipérbola): cuando x crece, y baja.</p>
                <p>La curva se acerca a los ejes pero nunca los toca, porque x · y = <strong>{fmt(ex.k)}</strong> nunca puede ser 0.</p>
              </>
            )}
          </div>
          <div className="ex-actions">
            <button className="btn btn--primary" onClick={onNext}>Siguiente tabla</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Interpretá el gráfico                                               */
/* ---------------------------------------------------------------- */

function Interpretar({ nivel, onSolved }) {
  const [n, setN] = useState(0);
  return <InterpretarEjercicio key={n} nivel={nivel} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

function InterpretarEjercicio({ nivel, onNext, onSolved }) {
  const [ex] = useState(() => genInterpretar(nivel));
  const markSolved = useSolveOnce(onSolved);
  const [choice, setChoice] = useState(null);
  const [kText, setKText] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const needsK = choice === "directa" || choice === "inversa";
  const typeOk = choice === ex.tipo;
  const kParsed = parseFrac(kText);
  const kOk = ex.tipo === "ninguna" || (kParsed !== null && eq(kParsed, ex.k));
  const allOk = checked && typeOk && kOk;
  const canCheck = choice !== null && (!needsK || kText.trim() !== "");

  const check = () => {
    setChecked(true);
    if (typeOk && kOk) markSolved();
  };

  const points = ex.pts.map((p, i) => ({ id: `p${i}`, x: p.x, y: p.y, label: `(${p.x}, ${p.y})`, color: "#1F3A34" }));

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Interpretá el gráfico</h3>
          <p className="ex-prompt">
            Leé las coordenadas de los puntos marcados y decidí qué relación representa el gráfico.
            Si es proporcional, calculá la constante k.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}>
          <RotateCcw size={14} /> otro gráfico
        </button>
      </div>

      <Plano positivo={ex.positivo} points={points} lines={ex.lines} curves={ex.curves} label="Gráfico para interpretar" />

      <OptionPicker options={TIPOS} value={choice} onChange={(id) => { setChoice(id); setChecked(false); }} disabled={allOk} label="Tipo de relación" />

      {needsK && (
        <div className="answer-row">
          <span className="answer-row__label">{choice === "directa" ? "k = y ÷ x =" : "k = x · y ="}</span>
          <AnswerInput
            value={kText}
            onChange={(v) => { setKText(v); setChecked(false); }}
            state={checked && typeOk ? (kOk ? "ok" : "bad") : undefined}
            width={70}
            disabled={allOk}
            label="constante de proporcionalidad"
          />
        </div>
      )}

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={check} disabled={!canCheck || allOk}>Verificar</button>
        <button className="btn btn--ghost" onClick={() => toggleHelp(showHelp, setShowHelp)}>
          {showHelp ? <EyeOff size={14} /> : <Eye size={14} />} {showHelp ? "ocultar pistas" : "ver pistas"}
        </button>
      </div>

      {checked && !typeOk && (
        <p className="feedback feedback--bad">
          Fijate en la forma: la p.d. es una recta que pasa por el origen; la p.i. es una curva que no toca los ejes. Si no es ninguna de esas, es otra relación.
        </p>
      )}
      {checked && typeOk && !kOk && (
        <p className="feedback feedback--bad">
          El tipo está bien. Para la constante usá las coordenadas de un punto: {choice === "directa" ? "dividí y ÷ x" : "multiplicá x · y"}.
        </p>
      )}

      {showHelp && (
        <div className="hand-calc">
          <p className="hc-title">Probá con los puntos marcados</p>
          {ex.pts.map((p, i) => (
            <p key={i}>
              ({p.x}, {p.y}): y ÷ x = {fmt(frac(p.y, p.x))} · x · y = {p.x * p.y}
            </p>
          ))}
          <p className="hc-note">Si y ÷ x da siempre lo mismo → directa. Si x · y da siempre lo mismo → inversa.</p>
        </div>
      )}

      {allOk && (
        <>
          <p className="feedback feedback--ok">¡Correcto!</p>
          <div className="hand-calc">
            {ex.tipo === "directa" && <p>Es una recta que pasa por el origen: proporcionalidad directa con k = <strong>{fmt(ex.k)}</strong>.</p>}
            {ex.tipo === "inversa" && <p>Es una curva que no toca los ejes: proporcionalidad inversa con k = <strong>{fmt(ex.k)}</strong>.</p>}
            {ex.tipo === "ninguna" && <p>No es ni p.d. ni p.i.: los cocientes y ÷ x y los productos x · y cambian de un punto a otro (y la gráfica no tiene la forma típica).</p>}
          </div>
          <div className="ex-actions">
            <button className="btn btn--primary" onClick={onNext}>Siguiente gráfico</button>
          </div>
        </>
      )}
    </div>
  );
}
