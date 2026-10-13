import { useState } from "react";
import { Star, GraduationCap } from "lucide-react";
import PropTabla from "./tabs/PropTabla.jsx";
import PropProblemas from "./tabs/PropProblemas.jsx";
import PropGrafico from "./tabs/PropGrafico.jsx";
import Tabla from "./tabs/Tabla.jsx";
import RaizOrdenada from "./tabs/RaizOrdenada.jsx";
import DosPuntos from "./tabs/DosPuntos.jsx";
import ParPerp from "./tabs/ParPerp.jsx";
import Desafio from "./tabs/Desafio.jsx";
import Bienvenida from "./components/Bienvenida.jsx";
import HelpGateModal from "./components/HelpGateModal.jsx";

/* Solapas de proporcionalidad: las ven todos los años. */
const PROP_TABS = [
  { id: "ptipo", label: "¿Qué tipo de tabla?", Component: PropTabla },
  { id: "pprob", label: "Problemas", Component: PropProblemas },
  { id: "pgraf", label: "Gráficos", Component: PropGrafico },
];

/* Solapas de función lineal: solo 2do y 3er año. */
const LINEAL_TABS = [
  { id: "tabla", label: "Tabla de valores", Component: Tabla },
  { id: "raiz", label: "Raíz y ordenada", Component: RaizOrdenada },
  { id: "dos", label: "Dos puntos", Component: DosPuntos },
  { id: "parper", label: "Paralelas y perpendiculares", Component: ParPerp },
  { id: "desafio", label: "Desafío", Component: Desafio },
];

const tabsFor = (anio) => (anio === 1 ? PROP_TABS : [...PROP_TABS, ...LINEAL_TABS]);

const SUBTITULO = {
  0: "Proporcionalidad y funciones lineales",
  1: "Proporcionalidad directa e inversa: tablas, problemas y gráficos",
  2: "Proporcionalidad y funciones lineales: tablas, problemas, gráficos, rectas",
};

export default function App() {
  const [anio, setAnio] = useState(null); // null = todavía no eligió; 1, 2 o 3
  const [tab, setTab] = useState(PROP_TABS[0].id);
  const [solved, setSolved] = useState(0);

  const tabs = anio === null ? [] : tabsFor(anio);
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];

  const elegirAnio = (a) => {
    setAnio(a);
    setTab(PROP_TABS[0].id);
  };

  return (
    <div className="board-app">
      <header className="board-header">
        <h1 className="board-title">Rectas en acción</h1>
        <p className="board-subtitle">{SUBTITULO[anio === null ? 0 : anio === 1 ? 1 : 2]}</p>
        <div className="header-badges">
          {anio !== null && (
            <button className="year-chip" onClick={() => setAnio(null)} title="Cambiar de año">
              <GraduationCap size={13} /> {anio}.º año · cambiar
            </button>
          )}
          <span className="solved-badge">
            <Star size={13} fill="#E8B33D" color="#E8B33D" /> {solved} {solved === 1 ? "ejercicio resuelto" : "ejercicios resueltos"}
          </span>
        </div>
      </header>

      {anio === null ? (
        <main className="paper">
          <Bienvenida onPick={elegirAnio} />
        </main>
      ) : (
        <>
          <nav className="tabs-row" aria-label="Secciones">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                className={`chalk-tab ${current.id === t.id ? "chalk-tab--active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {i + 1} · {t.label}
              </button>
            ))}
          </nav>

          <main className="paper">
            <current.Component key={`${anio}-${current.id}`} nivel={anio} onSolved={() => setSolved((n) => n + 1)} />
          </main>
        </>
      )}

      <HelpGateModal />
    </div>
  );
}
