import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import { toggleHelp } from "../helpGate";
import { AnswerInput, OptionPicker } from "../components/ui.jsx";
import { genProblema, TIPOS } from "../math/proporcionalidad.js";
import { parseFrac, eq } from "../math/fraction.js";
import { useSolveOnce } from "../hooks.js";

export default function PropProblemas({ nivel, onSolved }) {
  const [n, setN] = useState(0);
  return <Ejercicio key={n} nivel={nivel} onNext={() => setN((v) => v + 1)} onSolved={onSolved} />;
}

function Ejercicio({ nivel, onNext, onSolved }) {
  const [ex] = useState(() => genProblema(nivel));
  const markSolved = useSolveOnce(onSolved);

  const [choice, setChoice] = useState(null);
  const [ansText, setAnsText] = useState("");
  const [kText, setKText] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const numeric = ex.tipo !== "ninguna";
  const needsNumbers = choice === "directa" || choice === "inversa";
  const askK = nivel > 1 && numeric;

  const typeOk = choice === ex.tipo;
  const ansParsed = parseFrac(ansText);
  const ansOk = !numeric || (ansParsed !== null && eq(ansParsed, ex.answer));
  const kParsed = parseFrac(kText);
  const kOk = !askK || (kParsed !== null && eq(kParsed, ex.k));
  const allOk = checked && typeOk && ansOk && kOk;
  const canCheck = choice !== null && (!needsNumbers || (ansText.trim() !== "" && (!askK || kText.trim() !== "")));

  const touch = (setter) => (v) => {
    setter(v);
    setChecked(false);
  };
  const check = () => {
    setChecked(true);
    if (typeOk && ansOk && kOk) markSolved();
  };

  return (
    <div>
      <div className="ex-header">
        <div>
          <h3 className="ex-title">Problemas de aplicación</h3>
          <p className="ex-prompt">
            Leé el problema. Primero decidí qué tipo de relación hay entre las cantidades y después resolvelo.
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onNext}>
          <RotateCcw size={14} /> otro problema
        </button>
      </div>

      <p className="problem-text">{ex.texto}</p>

      <OptionPicker options={TIPOS} value={choice} onChange={touch(setChoice)} disabled={allOk} label="Tipo de relación" />

      {needsNumbers && (
        <>
          {askK && (
            <div className="answer-row">
              <span className="answer-row__label">{ex.constName}:</span>
              {ex.constPrefix && <span>{ex.constPrefix}</span>}
              <AnswerInput
                value={kText}
                onChange={touch(setKText)}
                state={checked && typeOk ? (kOk ? "ok" : "bad") : undefined}
                width={76}
                disabled={allOk}
                label="constante de proporcionalidad"
              />
            </div>
          )}
          <div className="answer-row">
            <span className="answer-row__label">Respuesta:</span>
            {ex.prefix && <span>{ex.prefix}</span>}
            <AnswerInput
              value={ansText}
              onChange={touch(setAnsText)}
              state={checked && typeOk ? (ansOk ? "ok" : "bad") : undefined}
              width={76}
              suffix={ex.suffix}
              disabled={allOk}
              label="respuesta del problema"
            />
          </div>
        </>
      )}

      <div className="ex-actions">
        <button className="btn btn--primary" onClick={check} disabled={!canCheck || allOk}>Verificar</button>
        {numeric && (
          <button className="btn btn--ghost" onClick={() => toggleHelp(showHelp, setShowHelp)}>
            {showHelp ? <EyeOff size={14} /> : <Eye size={14} />} {showHelp ? "ocultar desarrollo" : "ver desarrollo"}
          </button>
        )}
      </div>

      {checked && !typeOk && (
        <p className="feedback feedback--bad">
          {numeric
            ? "Pensá qué pasa si una cantidad se duplica: ¿la otra también se duplica (directa), se reduce a la mitad (inversa) o ninguna de las dos cosas?"
            : "Pensá qué pasa si una cantidad se duplica y fijate si la otra se comporta de forma proporcional."}
        </p>
      )}
      {checked && typeOk && numeric && (!ansOk || !kOk) && (
        <p className="feedback feedback--bad">
          El tipo está bien, pero hay un número para revisar.{" "}
          {ex.tipo === "directa"
            ? "Primero buscá cuánto vale una unidad (k = dato ÷ cantidad) y después multiplicá."
            : "Primero multiplicá las dos cantidades que te dan (eso es k) y después dividí por la nueva cantidad."}
        </p>
      )}

      {showHelp && numeric && (
        <div className="hand-calc">
          <p className="hc-title">Desarrollo</p>
          {ex.steps.map((s, i) => <p key={i}>{s}</p>)}
        </div>
      )}

      {allOk && (
        <>
          <p className="feedback feedback--ok">¡Muy bien!</p>
          <div className="hand-calc">
            {numeric
              ? ex.steps.map((s, i) => <p key={i}>{s}</p>)
              : <p>{ex.explicacion}</p>}
            {numeric && (
              <p className="hc-note">
                {ex.tipo === "directa"
                  ? "Es proporcionalidad directa: si una cantidad aumenta, la otra aumenta en la misma proporción."
                  : "Es proporcionalidad inversa: si una cantidad aumenta, la otra disminuye en la misma proporción."}
              </p>
            )}
          </div>
          <div className="ex-actions">
            <button className="btn btn--primary" onClick={onNext}>Siguiente problema</button>
          </div>
        </>
      )}
    </div>
  );
}
