import { Ruler, TrendingUp } from "lucide-react";

/* Pantalla inicial: el año elegido decide qué solapas y qué dificultad ve el alumno. */

const ANIOS = [
  {
    id: 1,
    titulo: "1er año",
    Icon: Ruler,
    texto: "Proporcionalidad directa e inversa: tablas, problemas y gráficos. Con números positivos y ejes x e y positivos.",
  },
  {
    id: 2,
    titulo: "2do año",
    Icon: TrendingUp,
    texto: "Proporcionalidad con decimales y constantes fraccionarias, gráficos en todo el plano y funciones lineales.",
  },
  {
    id: 3,
    titulo: "3er año",
    Icon: TrendingUp,
    texto: "Proporcionalidad con decimales y constantes fraccionarias, gráficos en todo el plano y funciones lineales.",
  },
];

export default function Bienvenida({ onPick }) {
  return (
    <div className="welcome">
      <h2 className="welcome__title">¿En qué año estás?</h2>
      <p className="welcome__text">Elegí tu año y te mostramos los ejercicios que corresponden.</p>
      <div className="year-grid">
        {ANIOS.map(({ id, titulo, Icon, texto }) => (
          <button key={id} className="year-card" onClick={() => onPick(id)}>
            <span className="year-card__icon"><Icon size={22} /></span>
            <span className="year-card__title">{titulo}</span>
            <span className="year-card__text">{texto}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
