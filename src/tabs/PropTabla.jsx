import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import { toggleHelp } from "../helpGate";
import { AnswerInput, OptionPicker } from "../components/ui.jsx";
import { genTablaTipo, fmt, TIPOS } from "../math/proporcionalidad.js";
import { parseFrac, eq, mul, div } from "../math/fraction.js";
import { useSolveOnce } from "../hooks.js";

export default function PropTabla({ nivel, onSolved }) {
  const [n, setN] = useState(0);
  return <Ejercicio key={n} nivel={nivel} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

const NOTA_NINGUNA = {
  aditiva: "Cada y es x más un número fijo: sumar no es multiplicar, así que no se cumple ninguna de las dos reglas.",
  afin: "Cada y se obtiene multiplicando y después sumando un número fijo: esa suma rompe la proporcionalidad.",
  cuadratica: "Cuando x se duplica, y se multiplica por 4: la relación no es proporcional.",
  "error-directa": "Estaba muy cerca de ser proporcional directa, pero hay un valor que rompe la regla.",
  "error-inversa": "Estaba muy cerca de ser proporcional inversa, pero hay un valor que rompe la regla.",
};

/** Mensaje de pista cuando el tipo elegido no es el correcto. */
function pistaTipo(choice) {
  if (choice === "directa") return "En una p.d. el cociente y ÷ x tiene que dar lo mismo en todas las columnas. Probá calcularlo: ¿se cumple?";
  if (choice === "inversa") return "En una p.i. el producto x · y tiene que dar lo mismo en todas las columnas. Probá calcularlo: ¿se cumple?";
  return "Probá calcular y ÷ x y también x · y en cada columna: si alguno de los dos da siempre lo mismo, la tabla sí es proporcional.";
}

function Ejercicio({ nivel, onNext, onSolved }) {
  const [ex] = useState(() => genTablaTipo(nivel));
  const markSolved = useSolveOnce(onSolved);

  const [choice, setChoice] = useState(null);
  const [kText, setKText] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const needsK = choice === "directa" || choice === "inversa";
  const typeOk = choice === ex.tipo;
  const kParsed = parseFrac(kText);
  const kOk = ex.tipo === "ninguna" || (kParsed !== null && ex.k !== null && eq(kParsed, ex.k));
  const allOk = checked && typeOk && kOk;
  const canCheck = choice !== null && (!needsK || kText.trim() !== "");

  const pick = (id) => {
    setChoice(id);
    setChecked(false);
  };
  const check = () => {
    setChecked(true);
    if (typeOk && kOk) markSolved();
  };

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">¿Qué tipo de tabla es?</h3>
          <p className="ex-prompt">
            Mirá la tabla y decidí si es de proporcionalidad directa, de proporcionalidad inversa o de ninguna de las dos.
            {nivel === 1 ? " Si es proporcional, calculá la constante." : " Si es proporcional, calculá la constante de proporcionalidad k."}
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
              {ex.xs.map((x, i) => (
                <th key={i} className="x-cell">{fmt(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>y</th>
              {ex.ys.map((y, i) => (
                <td key={i} className="x-cell">{fmt(y)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <OptionPicker options={TIPOS} value={choice} onChange={pick} disabled={allOk} label="Tipo de tabla" />

      {needsK && (
        <div className="answer-row">
          <span className="answer-row__label">
            {choice === "directa" ? "Constante: k = y ÷ x =" : "Constante: k = x · y ="}
          </span>
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
          {showHelp ? <EyeOff size={14} /> : <Eye size={14} />} {showHelp ? "ocultar cuentas" : "ver las cuentas"}
        </button>
      </div>

      {checked && !typeOk && <p className="feedback feedback--bad">{pistaTipo(choice)}</p>}
      {checked && typeOk && !kOk && (
        <p className="feedback feedback--bad">
          El tipo está bien. Revisá la constante: {choice === "directa" ? "dividí y ÷ x en una columna" : "multiplicá x · y en una columna"}.
        </p>
      )}

      {showHelp && (
        <div className="hand-calc">
          <p className="hc-title">Probamos las dos reglas en cada columna</p>
          <div className="table-wrap">
            <table className="val-table">
              <thead>
                <tr>
                  <th>x</th>
                  {ex.xs.map((x, i) => <th key={i} className="x-cell">{fmt(x)}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>y ÷ x</th>
                  {ex.xs.map((x, i) => <td key={i}>{fmt(div(ex.ys[i], x))}</td>)}
                </tr>
                <tr>
                  <th>x · y</th>
                  {ex.xs.map((x, i) => <td key={i}>{fmt(mul(x, ex.ys[i]))}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="hc-note">Si la fila y ÷ x da siempre lo mismo → directa. Si la fila x · y da siempre lo mismo → inversa. Si ninguna → ninguna de las dos.</p>
        </div>
      )}

      {allOk && (
        <>
          <p className="feedback feedback--ok">¡Correcto!</p>
          <div className="hand-calc">
            {ex.tipo === "directa" && (
              <>
                <p>Todos los cocientes y ÷ x dan <strong>{fmt(ex.k)}</strong>. Si x se multiplica por un número, y se multiplica por el mismo número.</p>
                <p className="hc-formula">y = {fmt(ex.k)} · x</p>
              </>
            )}
            {ex.tipo === "inversa" && (
              <>
                <p>Todos los productos x · y dan <strong>{fmt(ex.k)}</strong>. Si x se multiplica por un número, y se divide por ese mismo número.</p>
                <p className="hc-formula">y = {fmt(ex.k)} ÷ x</p>
              </>
            )}
            {ex.tipo === "ninguna" && (
              <>
                <p>Ni los cocientes y ÷ x ni los productos x · y se mantienen constantes.</p>
                <p className="hc-note">{NOTA_NINGUNA[ex.variante]}</p>
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
