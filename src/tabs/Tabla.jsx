import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import Plano from "../components/Plano.jsx";
import { AnswerInput, Legend } from "../components/ui.jsx";
import { genTabla } from "../math/generators.js";
import { parseFrac, eq, toNumber, format, paren } from "../math/fraction.js";
import { formatLine } from "../math/line.js";
import { useSolveOnce } from "../hooks.js";

export default function Tabla({ onSolved }) {
  const [n, setN] = useState(0);
  return <TablaEjercicio key={n} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

function TablaEjercicio({ onNext, onSolved }) {
  const [ex] = useState(() => genTabla());
  const markSolved = useSolveOnce(onSolved);

  const [ys, setYs] = useState(() => ex.xs.map(() => ""));
  const [tableChecked, setTableChecked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [placed, setPlaced] = useState([]); // [{x, y}] en números enteros
  const [plotChecked, setPlotChecked] = useState(false);

  const cellOk = ex.ys.map((y, i) => {
    const v = parseFrac(ys[i]);
    return v !== null && eq(v, y);
  });
  const tableOk = tableChecked && cellOk.every(Boolean);

  const expected = ex.xs.map((x, i) => ({ x: toNumber(x), y: toNumber(ex.ys[i]) }));
  const isExpected = (p) => expected.some((e) => e.x === p.x && e.y === p.y);
  const wrongPoints = placed.filter((p) => !isExpected(p));
  const missing = expected.filter((e) => !placed.some((p) => p.x === e.x && p.y === e.y));
  const plotOk = plotChecked && wrongPoints.length === 0 && missing.length === 0;

  const setY = (i, v) => {
    setYs((prev) => prev.map((old, j) => (j === i ? v : old)));
    setTableChecked(false);
  };

  const handlePlaneClick = (p) => {
    if (!tableOk || plotOk) return;
    setPlotChecked(false);
    setPlaced((prev) =>
      prev.some((q) => q.x === p.x && q.y === p.y) ? prev.filter((q) => !(q.x === p.x && q.y === p.y)) : [...prev, p],
    );
  };

  const checkPlot = () => {
    setPlotChecked(true);
    if (wrongPoints.length === 0 && missing.length === 0) markSolved();
  };

  const points = placed.map((p, i) => ({
    id: `p${i}`,
    x: p.x,
    y: p.y,
    label: `(${p.x}, ${p.y})`,
    color: plotChecked && !isExpected(p) ? "#D96C6C" : "#1F3A34",
  }));

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Tabla de valores</h3>
          <p className="ex-prompt">
            Completá la tabla reemplazando cada valor de x en la fórmula. Después ubicá los puntos en el plano.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}>
          <RotateCcw size={14} /> otra función
        </button>
      </div>

      <div className="eq-big">f(x) = {formatLine(ex.line).replace("y = ", "")}</div>

      <div className="table-wrap">
        <table className="val-table">
          <thead>
            <tr>
              <th>x</th>
              {ex.xs.map((x, i) => (
                <th key={i} className="x-cell">{format(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>y = f(x)</th>
              {ex.ys.map((y, i) => (
                <td key={i} className={tableChecked ? (cellOk[i] ? "cell--ok" : "cell--bad") : ""}>
                  <AnswerInput
                    value={ys[i]}
                    onChange={(v) => setY(i, v)}
                    state={tableChecked ? (cellOk[i] ? "ok" : "bad") : undefined}
                    width={54}
                    label={`y para x = ${format(ex.xs[i])}`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={() => setTableChecked(true)}>Verificar tabla</button>
        <button className="btn btn--ghost" onClick={() => setShowHelp((v) => !v)}>
          {showHelp ? <EyeOff size={14} /> : <Eye size={14} />} {showHelp ? "ocultar cuentas" : "ver las cuentas"}
        </button>
      </div>

      {tableChecked && (
        <p className={`feedback ${tableOk ? "feedback--ok" : "feedback--bad"}`}>
          {tableOk
            ? "¡Tabla correcta! Ahora ubicá los 5 puntos en el plano."
            : "Hay celdas para revisar (las marcadas en rojo). Reemplazá x en la fórmula y calculá con cuidado los signos."}
        </p>
      )}

      {showHelp && (
        <div className="hand-calc">
          <p className="hc-title">Reemplazamos cada x en la fórmula</p>
          {ex.xs.map((x, i) => (
            <p key={i}>
              x = {format(x)} → y = {paren(ex.line.m)} · {paren(x)} + {paren(ex.line.b)} = <strong>{format(ex.ys[i])}</strong>
            </p>
          ))}
        </div>
      )}

      <h4 className="section-title">Ubicá los puntos en el plano</h4>
      {!tableOk ? (
        <p className="note">Primero completá y verificá la tabla.</p>
      ) : (
        <p className="note">
          Tocá la cuadrícula para poner un punto (tocalo de nuevo para sacarlo). Puestos: {placed.length} de {ex.xs.length}.
        </p>
      )}

      <Plano
        points={points}
        lines={plotOk ? [{ line: ex.line, color: "#E8B33D" }] : []}
        onPlaneClick={tableOk && !plotOk ? handlePlaneClick : undefined}
        label="Plano para ubicar los puntos de la tabla"
      />
      {plotOk && <Legend items={[{ color: "#E8B33D", label: formatLine(ex.line) }]} />}

      {tableOk && !plotOk && (
        <div className="ex-actions">
          <button className="btn btn--primary" onClick={checkPlot} disabled={placed.length === 0}>Verificar puntos</button>
        </div>
      )}

      {plotChecked && !plotOk && (
        <p className="feedback feedback--bad">
          {wrongPoints.length > 0 && `${wrongPoints.length} punto(s) están mal ubicados (en rojo). `}
          {missing.length > 0 && `Faltan ${missing.length} punto(s). `}
          Cada punto es (x, y): primero se avanza en x y después se sube o baja en y.
        </p>
      )}

      {plotOk && (
        <>
          <p className="feedback feedback--ok">¡Perfecto! Los puntos quedan alineados: por eso la función es lineal.</p>
          <div className="hand-calc">
            <p className="hc-title">Mirá la tabla otra vez</p>
            <p>
              Cada vez que x aumenta 1, y cambia en <strong>{format(ex.line.m)}</strong> (esa es la <strong>pendiente</strong>).
              {ex.line.m.d !== 1 && ` En esta tabla x avanza de a ${ex.line.m.d}, por eso y cambia de a ${ex.line.m.n}.`}
            </p>
            <p>
              Cuando x = 0, y vale <strong>{format(ex.line.b)}</strong> (esa es la <strong>ordenada al origen</strong>).
            </p>
          </div>
          <div className="ex-actions">
            <button className="btn btn--primary" onClick={onNext}>Siguiente función</button>
          </div>
        </>
      )}
    </div>
  );
}
