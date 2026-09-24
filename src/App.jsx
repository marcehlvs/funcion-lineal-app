import { useState } from "react";
import { Star } from "lucide-react";
import Tabla from "./tabs/Tabla.jsx";
import RaizOrdenada from "./tabs/RaizOrdenada.jsx";
import DosPuntos from "./tabs/DosPuntos.jsx";
import ParPerp from "./tabs/ParPerp.jsx";
import Desafio from "./tabs/Desafio.jsx";
import HelpGateModal from "./components/HelpGateModal.jsx";

const TABS = [
  { id: "tabla", label: "1 · Tabla", Component: Tabla },
  { id: "raiz", label: "2 · Raíz y ordenada", Component: RaizOrdenada },
  { id: "dos", label: "3 · Dos puntos", Component: DosPuntos },
  { id: "parper", label: "4 · Paralelas y perpendiculares", Component: ParPerp },
  { id: "desafio", label: "5 · Desafío", Component: Desafio },
];

export default function App() {
  const [tab, setTab] = useState("tabla");
  const [solved, setSolved] = useState(0);
  const { Component } = TABS.find((t) => t.id === tab);

  return (
    <div className="board-app">
      <header className="board-header">
        <h1 className="board-title">Rectas en acción</h1>
        <p className="board-subtitle">Funciones lineales: tabla, raíz y ordenada, dos puntos, paralelas y perpendiculares</p>
        <span className="solved-badge">
          <Star size={13} fill="#E8B33D" color="#E8B33D" /> {solved} {solved === 1 ? "ejercicio resuelto" : "ejercicios resueltos"}
        </span>
      </header>

      <nav className="tabs-row" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`chalk-tab ${tab === t.id ? "chalk-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="paper">
        <Component key={tab} onSolved={() => setSolved((n) => n + 1)} />
      </main>

      <HelpGateModal />
    </div>
  );
}
