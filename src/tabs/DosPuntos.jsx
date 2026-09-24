import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import Plano from "../components/Plano.jsx";
import { AnswerInput, Legend } from "../components/ui.jsx";
import { genDosPuntos } from "../math/generators.js";
import { frac, parseFrac, eq, toNumber, format, paren, sub, neg } from "../math/fraction.js";
import { pt, fromPoints, formatLine } from "../math/line.js";
import { useSolveOnce } from "../hooks.js";

export default function DosPuntos({ onSolved }) {
  const [mode, setMode] = useState("ejercicio");
  const [n, setN] = useState(0);
  return (
    <div>
      <div className="seg">
        <button className={`seg__btn ${mode === "ejercicio" ? "seg__btn--active" : ""}`} onClick={() => setMode("ejercicio")}>
          Ejercicio guiado
        </button>
        <button className={`seg__btn ${mode === "explorar" ? "seg__btn--active" : ""}`} onClick={() => setMode("explorar")}>
          Explorar (arrastrá los puntos)
        </button>
      </div>
      {mode === "ejercicio" ? (
        <Ejercicio key={n} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />
      ) : (
        <Explorar />
      )}
    </div>
  );
}

/* Desarrollo a mano de una recta por dos puntos (lo usan Ejercicio y Explorar). */
function Desarrollo({ p, q, line }) {
  if (line === null) return <div className="hand-calc"><p>Los dos puntos coinciden: por un solo punto pasan infinitas rectas.</p></div>;
  if (line.kind === "vertical") {
    return (
      <div className="hand-calc">
        <p className="hc-title">Pendiente</p>
        <p>x₂ − x₁ = {format(q.x)} − {paren(p.x)} = <strong>0</strong> → no se puede dividir por cero: <strong>no hay pendiente</strong>.</p>
        <p className="hc-title">Ecuación</p>
        <p>Los dos puntos tienen x = {format(p.x)}, entonces la recta es <strong>x = {format(p.x)}</strong> (vertical).</p>
        <p className="hc-note">No es una función: a un mismo valor de x le corresponden infinitos valores de y.</p>
      </div>
    );
  }
  const dy = sub(q.y, p.y);
  const dx = sub(q.x, p.x);
  return (
    <div className="hand-calc">
      <p className="hc-title">1) Pendiente</p>
      <p className="hc-formula">m = (y₂ − y₁) / (x₂ − x₁)</p>
      <p>
        m = ({format(q.y)} − {paren(p.y)}) / ({format(q.x)} − {paren(p.x)}) = {format(dy)} / {format(dx)} = <strong>{format(line.m)}</strong>
      </p>
      <p className="hc-title">2) Ordenada al origen</p>
      <p className="hc-formula">y₁ = m·x₁ + b → b = y₁ − m·x₁</p>
      <p>
        b = {format(p.y)} − {paren(line.m)} · {paren(p.x)} = <strong>{format(line.b)}</strong>
      </p>
      <p className="hc-title">3) Ecuación</p>
      <p><strong>{formatLine(line)}</strong></p>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Ejercicio guiado                                                    */
/* ---------------------------------------------------------------- */

function Ejercicio({ onNext, onSolved }) {
  const [ex] = useState(() => genDosPuntos());
  const markSolved = useSolveOnce(onSolved);
  const isVertical = ex.line.kind === "vertical";

  const [stage, setStage] = useState(0); // 0 = pendiente, 1 = ordenada / x = c, 2 = resuelto
  const [claimVertical, setClaimVertical] = useState(false);
  const [mStr, setMStr] = useState("");
  const [bStr, setBStr] = useState("");
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [showDev, setShowDev] = useState(false);

  const checkSlope = () => {
    setChecked(true);
    if (isVertical) {
      if (claimVertical) { setMessage(""); setStage(1); setChecked(false); }
      else setMessage("Fijate en x₂ − x₁: ¿qué da? Si es 0 no se puede dividir…");
      return;
    }
    if (claimVertical) { setMessage("Estos puntos tienen distinto x, así que sí hay pendiente."); return; }
    const v = parseFrac(mStr);
    if (v === null) { setMessage("Escribí la pendiente como número o fracción (por ejemplo 2 o -3/4)."); return; }
    if (eq(v, ex.line.m)) { setMessage(""); setStage(1); setChecked(false); return; }
    const mirrored = eq(v, neg(ex.line.m));
    setMessage(mirrored ? "Casi: te dio el signo opuesto. Restá los y y los x en el mismo orden (P₂ − P₁ arriba y abajo)." : "No coincide. Recordá m = (y₂ − y₁) / (x₂ − x₁).");
  };

  const checkOrdinate = () => {
    setChecked(true);
    const v = parseFrac(bStr);
    const expected = isVertical ? ex.line.x : ex.line.b;
    if (v !== null && eq(v, expected)) { setMessage(""); setStage(2); markSolved(); }
    else setMessage(isVertical ? "Los dos puntos tienen el mismo x: esa es la ecuación." : "No coincide. Reemplazá uno de los puntos en y = m·x + b y despejá b.");
  };

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Recta que pasa por dos puntos</h3>
          <p className="ex-prompt">
            Hallá la pendiente y la ordenada al origen de la recta que pasa por
            <strong> P₁ = ({format(ex.p.x)}, {format(ex.p.y)})</strong> y <strong>P₂ = ({format(ex.q.x)}, {format(ex.q.y)})</strong>.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}><RotateCcw size={14} /> otro ejercicio</button>
      </div>

      <h4 className="section-title">Paso 1 · Pendiente</h4>
      <div className="answer-row">
        <span className="answer-row__label">m = (y₂ − y₁) / (x₂ − x₁) =</span>
        {stage === 0 ? (
          <>
            <AnswerInput value={mStr} onChange={(v) => { setMStr(v); setChecked(false); }} width={72} disabled={claimVertical} state={checked && message ? "bad" : undefined} label="pendiente" />
            <button className={`btn btn--ghost btn--tiny`} onClick={() => { setClaimVertical((v) => !v); setChecked(false); }}>
              {claimVertical ? "sí hay pendiente" : "no existe (vertical)"}
            </button>
            <button className="btn btn--primary" onClick={checkSlope}>Verificar</button>
          </>
        ) : (
          <strong>{isVertical ? "no existe (recta vertical)" : format(ex.line.m)} ✓</strong>
        )}
      </div>

      {stage >= 1 && (
        <>
          <h4 className="section-title">Paso 2 · {isVertical ? "Ecuación de la recta vertical" : "Ordenada al origen"}</h4>
          <div className="answer-row">
            <span className="answer-row__label">{isVertical ? "x =" : "b = y₁ − m·x₁ ="}</span>
            {stage === 1 ? (
              <>
                <AnswerInput value={bStr} onChange={(v) => { setBStr(v); setChecked(false); }} width={72} label="ordenada" state={checked && message ? "bad" : undefined} />
                <button className="btn btn--primary" onClick={checkOrdinate}>Verificar</button>
              </>
            ) : (
              <strong>{format(isVertical ? ex.line.x : ex.line.b)} ✓</strong>
            )}
          </div>
        </>
      )}

      {message && <p className="feedback feedback--bad">{message}</p>}
      {stage === 2 && (
        <p className="feedback feedback--ok">
          ¡Excelente! La ecuación es <strong>{formatLine(ex.line)}</strong>.{isVertical && " Y recordá: una recta vertical no es función."}
        </p>
      )}

      <div className="ex-actions">
        <button className="btn btn--ghost" onClick={() => setShowDev((v) => !v)}>
          {showDev ? <EyeOff size={14} /> : <Eye size={14} />} {showDev ? "ocultar desarrollo" : "ver desarrollo"}
        </button>
        {stage === 2 && <button className="btn btn--primary" onClick={onNext}>Siguiente</button>}
      </div>

      {showDev && <Desarrollo p={ex.p} q={ex.q} line={ex.line} />}

      <Plano
        lines={stage === 2 ? [{ line: ex.line, color: "#E8B33D" }] : []}
        points={[
          { id: "p", x: toNumber(ex.p.x), y: toNumber(ex.p.y), color: "#3E7A70", label: `P₁(${format(ex.p.x)}, ${format(ex.p.y)})` },
          { id: "q", x: toNumber(ex.q.x), y: toNumber(ex.q.y), color: "#B14E4E", label: `P₂(${format(ex.q.x)}, ${format(ex.q.y)})` },
        ]}
        label="Los dos puntos"
      />
      {stage === 2 && <Legend items={[{ color: "#E8B33D", label: formatLine(ex.line) }]} />}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Explorar: arrastrar los puntos y ver los cálculos en vivo           */
/* ---------------------------------------------------------------- */

function Explorar() {
  const [pts, setPts] = useState({ p: { x: -3, y: -2 }, q: { x: 2, y: 3 } });
  const move = (id, pos) => setPts((prev) => ({ ...prev, [id]: pos }));

  const p = pt(frac(pts.p.x), frac(pts.p.y));
  const q = pt(frac(pts.q.x), frac(pts.q.y));
  const line = fromPoints(p, q);

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Explorá con los dos puntos</h3>
          <p className="ex-prompt">
            Arrastrá <strong>P₁</strong> y <strong>P₂</strong> por el plano. Mirá cómo cambian la pendiente y la ecuación. Probá poner
            los dos puntos en la misma vertical.
          </p>
        </div>
      </div>

      <div className="two-col">
        <Plano
          lines={line ? [{ line, color: "#E8B33D" }] : []}
          points={[
            { id: "p", x: pts.p.x, y: pts.p.y, color: "#3E7A70", label: `P₁(${pts.p.x}, ${pts.p.y})`, draggable: true },
            { id: "q", x: pts.q.x, y: pts.q.y, color: "#B14E4E", label: `P₂(${pts.q.x}, ${pts.q.y})`, draggable: true },
          ]}
          onPointMove={move}
          label="Plano con dos puntos que se pueden arrastrar"
        />
        <div>
          <Desarrollo p={p} q={q} line={line} />
        </div>
      </div>
    </div>
  );
}
