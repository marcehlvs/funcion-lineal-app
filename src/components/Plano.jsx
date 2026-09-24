import { useId, useRef, useState } from "react";
import { toNumber } from "../math/fraction.js";
import { PLANE_R } from "../math/generators.js";

/* Plano cartesiano en SVG.
 *
 * lines:  [{ line, color, dashed }]   line viene de math/line.js (fracciones)
 * points: [{ id, x, y, color, label, shape: "dot" | "star", lit, draggable }]
 *         x e y son NÚMEROS (el llamador convierte con toNumber)
 * onPlaneClick({x, y})       → tocar la cuadrícula (coordenadas enteras)
 * onPointMove(id, {x, y})    → arrastrar un punto con draggable: true
 */

const S = 440; // lado del viewBox
const PAD = 26; // margen para los números de los ejes
const INNER = S - 2 * PAD;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function starPoints(cx, cy, outer = 12, inner = 5) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function Plano({
  lines = [],
  points = [],
  onPlaneClick,
  onPointMove,
  R = PLANE_R,
  label = "Plano cartesiano",
}) {
  const svgRef = useRef(null);
  const clipId = useId();
  const [hover, setHover] = useState(null);
  const [dragId, setDragId] = useState(null);

  const px = (x) => PAD + ((x + R) / (2 * R)) * INNER;
  const py = (y) => PAD + ((R - y) / (2 * R)) * INNER;

  const toPlane = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * S;
    const sy = ((e.clientY - rect.top) / rect.height) * S;
    return { x: ((sx - PAD) / INNER) * 2 * R - R, y: R - ((sy - PAD) / INNER) * 2 * R };
  };
  const snap = (p) => ({ x: clamp(Math.round(p.x), -R, R), y: clamp(Math.round(p.y), -R, R) });

  const handleMove = (e) => {
    if (dragId !== null) {
      onPointMove?.(dragId, snap(toPlane(e)));
    } else if (onPlaneClick) {
      setHover(snap(toPlane(e)));
    }
  };

  const ticks = [];
  for (let i = -R; i <= R; i++) ticks.push(i);
  const labelStep = R > 6 ? 2 : 1;

  return (
    <div className="plano-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${S} ${S}`}
        className={`plano ${onPlaneClick ? "plano--clickable" : ""}`}
        role="img"
        aria-label={label}
        onClick={(e) => onPlaneClick?.(snap(toPlane(e)))}
        onPointerMove={handleMove}
        onPointerUp={() => setDragId(null)}
        onPointerCancel={() => setDragId(null)}
        onPointerLeave={() => {
          setHover(null);
          setDragId(null);
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD} y={PAD} width={INNER} height={INNER} />
          </clipPath>
        </defs>

        {/* cuadrícula */}
        {ticks.map((i) => (
          <g key={i} stroke="#EEE8D6" strokeWidth="1">
            <line x1={px(i)} y1={PAD} x2={px(i)} y2={S - PAD} />
            <line x1={PAD} y1={py(i)} x2={S - PAD} y2={py(i)} />
          </g>
        ))}

        {/* ejes con flecha */}
        <g stroke="#5A5142" strokeWidth="1.6" fill="#5A5142">
          <line x1={PAD - 6} y1={py(0)} x2={S - PAD + 6} y2={py(0)} />
          <line x1={px(0)} y1={S - PAD + 6} x2={px(0)} y2={PAD - 6} />
          <polygon points={`${S - PAD + 10},${py(0)} ${S - PAD + 1},${py(0) - 4} ${S - PAD + 1},${py(0) + 4}`} />
          <polygon points={`${px(0)},${PAD - 10} ${px(0) - 4},${PAD - 1} ${px(0) + 4},${PAD - 1}`} />
        </g>
        <g fontSize="10.5" fill="#8A8065" fontFamily="Inter, sans-serif">
          {ticks
            .filter((i) => i !== 0 && i % labelStep === 0)
            .map((i) => (
              <g key={i}>
                <text x={px(i)} y={py(0) + 14} textAnchor="middle">{i}</text>
                <text x={px(0) - 6} y={py(i) + 3.5} textAnchor="end">{i}</text>
              </g>
            ))}
          <text x={px(0) - 6} y={py(0) + 14} textAnchor="end">0</text>
          <text x={S - 8} y={py(0) - 8} textAnchor="end" fontStyle="italic" fill="#5A5142" fontSize="13">x</text>
          <text x={px(0) + 9} y={14} fontStyle="italic" fill="#5A5142" fontSize="13">y</text>
        </g>

        {/* rectas (recortadas al recuadro) */}
        <g clipPath={`url(#${clipId})`}>
          {lines.map(({ line, color = "#1F3A34", dashed = false }, i) => {
            const stroke = { stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeDasharray: dashed ? "8 6" : undefined };
            if (line.kind === "vertical") {
              const x = toNumber(line.x);
              return <line key={i} x1={px(x)} y1={py(-R - 1)} x2={px(x)} y2={py(R + 1)} {...stroke} />;
            }
            const m = toNumber(line.m);
            const b = toNumber(line.b);
            return <line key={i} x1={px(-R - 1)} y1={py(m * (-R - 1) + b)} x2={px(R + 1)} y2={py(m * (R + 1) + b)} {...stroke} />;
          })}
        </g>

        {/* fantasma del punto que se va a ubicar */}
        {onPlaneClick && hover && dragId === null && (
          <circle cx={px(hover.x)} cy={py(hover.y)} r="6" fill="#5FA8A0" opacity="0.35" pointerEvents="none" />
        )}

        {/* puntos y estrellas */}
        {points.map((p) => {
          const cx = px(p.x);
          const cy = py(p.y);
          const color = p.color ?? "#1F3A34";
          const drag = p.draggable ? { className: "plano-point--drag", onPointerDown: (e) => { e.stopPropagation(); setDragId(p.id); e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId); } } : {};
          return (
            <g key={p.id} {...drag}>
              {p.shape === "star" ? (
                <polygon
                  points={starPoints(cx, cy)}
                  fill={p.lit ? "#E8B33D" : "#fff"}
                  stroke={p.lit ? "#B98514" : "#A79B78"}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  {p.draggable && <circle cx={cx} cy={cy} r="14" fill="transparent" />}
                  <circle cx={cx} cy={cy} r="6.5" fill={color} stroke="#fff" strokeWidth="2" />
                </>
              )}
              {p.label && (
                <g fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif" pointerEvents="none">
                  {/* halo blanco debajo + texto de color encima (funciona en todos los renderizadores) */}
                  <text x={cx + 10} y={cy - 9} fill="#fff" stroke="#fff" strokeWidth="4" strokeLinejoin="round" aria-hidden="true">{p.label}</text>
                  <text x={cx + 10} y={cy - 9} fill={color}>{p.label}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
