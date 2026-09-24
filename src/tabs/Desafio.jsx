import { useState } from "react";
import { Heart, Star, Minus, Plus, Trophy } from "lucide-react";
import Plano from "../components/Plano.jsx";
import { Legend } from "../components/ui.jsx";
import { genLevel } from "../math/generators.js";
import { frac, eq, mul, format, toNumber } from "../math/fraction.js";
import { fn, formatLine, passesThrough } from "../math/line.js";

const START_LIVES = 3;
const BEST_KEY = "rectas-en-accion:mejor-puntaje";

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0; // sin almacenamiento disponible: se juega igual
  }
}
function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* sin almacenamiento disponible: no pasa nada */
  }
}

const GOALS = {
  points: "Armá una recta que pase por las 3 estrellas.",
  parallel: "Armá una recta PARALELA a la azul que pase por la estrella.",
  perpendicular: "Armá una recta PERPENDICULAR a la azul que pase por la estrella.",
};

export default function Desafio({ onSolved }) {
  const [levelNo, setLevelNo] = useState(0);
  const [level, setLevel] = useState(() => genLevel(0));
  const [m4, setM4] = useState(0); // pendiente en cuartos: m = m4 / 4
  const [b4, setB4] = useState(0); // ordenada en cuartos: b = b4 / 4
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [wrongHere, setWrongHere] = useState(0);
  const [phase, setPhase] = useState("playing"); // "playing" | "won" | "over"
  const [message, setMessage] = useState("");
  const [gained, setGained] = useState(0);

  const m = frac(m4, 4);
  const b = frac(b4, 4);
  const line = fn(m, b);
  const lit = level.stars.map((s) => passesThrough(line, s));

  const startLevel = (n) => {
    setLevelNo(n);
    setLevel(genLevel(n));
    setM4(0);
    setB4(0);
    setWrongHere(0);
    setMessage("");
    setPhase("playing");
  };

  const restart = () => {
    setLives(START_LIVES);
    setScore(0);
    setStreak(0);
    startLevel(0);
  };

  const finishGame = (finalScore) => {
    setPhase("over");
    if (finalScore > best) {
      setBest(finalScore);
      saveBest(finalScore);
    }
  };

  const submit = () => {
    const allLit = lit.every(Boolean);
    let ok;
    let why;
    if (level.type === "points") {
      ok = allLit;
      why = `Tu recta pasa por ${lit.filter(Boolean).length} de 3 estrellas. Con dos puntos ya queda determinada la recta.`;
    } else if (level.type === "parallel") {
      ok = allLit && eq(m, level.reference.m);
      why = allLit
        ? "Pasa por la estrella, pero no es paralela: tiene que tener la misma pendiente que la azul."
        : "Todavía no pasa por la estrella. Ajustá la ordenada.";
    } else {
      ok = allLit && eq(mul(m, level.reference.m), frac(-1));
      why = allLit
        ? "Pasa por la estrella, pero no es perpendicular: la pendiente tiene que ser −1/m."
        : "Todavía no pasa por la estrella. Ajustá la ordenada.";
    }

    if (ok) {
      const points = Math.max(25, 100 - 25 * wrongHere) + 10 * streak;
      const total = score + points;
      setScore(total);
      setGained(points);
      setStreak((s) => s + 1);
      setPhase("won");
      setMessage("");
      if (total > best) {
        setBest(total);
        saveBest(total);
      }
      onSolved?.();
    } else {
      const left = lives - 1;
      setLives(left);
      setStreak(0);
      setWrongHere((w) => w + 1);
      setMessage(why);
      if (left === 0) finishGame(score);
    }
  };

  const legend = [{ color: "#E8B33D", label: `tu recta: ${formatLine(line)}` }];
  if (level.reference) legend.unshift({ color: "#3B6FB5", label: `dada: ${formatLine(level.reference)}` });

  const lines = [];
  if (level.reference) lines.push({ line: level.reference, color: "#3B6FB5" });
  lines.push({ line, color: "#E8B33D" });

  const points = level.stars.map((s, i) => ({
    id: `s${i}`,
    x: toNumber(s.x),
    y: toNumber(s.y),
    shape: "star",
    lit: lit[i],
  }));

  return (
    <div>
      <div className="game-bar">
        <div className="game-bar__group">
          <span>Nivel <span className="game-bar__num">{levelNo + 1}</span></span>
          <span>Puntos <span className="game-bar__num">{score}</span></span>
          <span>Racha <span className="game-bar__num">{streak}</span></span>
        </div>
        <div className="game-bar__group">
          <span className="hearts" aria-label={`${lives} vidas`}>
            {Array.from({ length: START_LIVES }, (_, i) => (
              <Heart key={i} size={18} color="#E8635C" fill={i < lives ? "#E8635C" : "none"} />
            ))}
          </span>
          <span title="Mejor puntaje"><Trophy size={15} style={{ verticalAlign: "-2px" }} /> {best}</span>
        </div>
      </div>

      {phase === "over" ? (
        <div className="game-over">
          <h3>¡Se acabaron las vidas!</h3>
          <p className="ex-prompt" style={{ margin: "0 auto 12px" }}>
            Llegaste al nivel {levelNo + 1} con <strong>{score}</strong> puntos. Tu mejor puntaje es <strong>{best}</strong>.
          </p>
          <button className="btn btn--primary" onClick={restart}>Jugar de nuevo</button>
        </div>
      ) : (
        <>
          <div className="ex-header">
            <div>
              <h3 className="ex-title"><Star size={18} style={{ verticalAlign: "-3px" }} /> Apuntá a las estrellas</h3>
              <p className="ex-prompt">{GOALS[level.type]}</p>
            </div>
          </div>

          <div className="game-eq">{formatLine(line)}</div>

          <div className="slider-row">
            <span className="slider-row__name">m</span>
            <button className="btn btn--ghost btn--tiny" onClick={() => setM4((v) => Math.max(-20, v - 1))} disabled={phase !== "playing"} aria-label="bajar pendiente"><Minus size={12} /></button>
            <input type="range" min={-20} max={20} step={1} value={m4} onChange={(e) => setM4(Number(e.target.value))} disabled={phase !== "playing"} aria-label="pendiente m" />
            <button className="btn btn--ghost btn--tiny" onClick={() => setM4((v) => Math.min(20, v + 1))} disabled={phase !== "playing"} aria-label="subir pendiente"><Plus size={12} /></button>
            <span className="slider-row__val">{format(m)}</span>
          </div>
          <div className="slider-row">
            <span className="slider-row__name">b</span>
            <button className="btn btn--ghost btn--tiny" onClick={() => setB4((v) => Math.max(-40, v - 1))} disabled={phase !== "playing"} aria-label="bajar ordenada"><Minus size={12} /></button>
            <input type="range" min={-40} max={40} step={1} value={b4} onChange={(e) => setB4(Number(e.target.value))} disabled={phase !== "playing"} aria-label="ordenada b" />
            <button className="btn btn--ghost btn--tiny" onClick={() => setB4((v) => Math.min(40, v + 1))} disabled={phase !== "playing"} aria-label="subir ordenada"><Plus size={12} /></button>
            <span className="slider-row__val">{format(b)}</span>
          </div>

          <p className="stars-lit">⭐ Estrellas encendidas: {lit.filter(Boolean).length} de {level.stars.length}</p>

          <Plano lines={lines} points={points} label="Plano del desafío con estrellas" />
          <Legend items={legend} />

          {message && <p className="feedback feedback--bad">{message}</p>}

          {phase === "playing" ? (
            <div className="ex-actions">
              <button className="btn btn--primary" onClick={submit}>¡Listo!</button>
            </div>
          ) : (
            <>
              <p className="feedback feedback--ok">
                ¡Nivel superado! +{gained} puntos{streak > 1 ? ` (racha de ${streak})` : ""}.
              </p>
              <div className="ex-actions">
                <button className="btn btn--primary" onClick={() => startLevel(levelNo + 1)}>Siguiente nivel</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
