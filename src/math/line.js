import { frac, add, sub, mul, div, neg, eq, isZero, format, parseFrac, ONE } from "./fraction.js";

/* ---------------------------------------------------------------- */
/* Modelo de recta                                                     */
/* ---------------------------------------------------------------- */
/* Hay dos clases de recta:
     { kind: "fn", m, b }     y = m·x + b     (es función)
     { kind: "vertical", x }  x = c           (NO es función)
   m, b, x son fracciones (ver fraction.js). Un punto es { x, y } de fracciones. */

export const pt = (x, y) => ({ x, y });
export const fn = (m, b) => ({ kind: "fn", m, b });
export const vertical = (x) => ({ kind: "vertical", x });

export const isFunction = (line) => line.kind === "fn";

/** Recta por dos puntos. Devuelve null si son el mismo punto. */
export function fromPoints(p, q) {
  if (eq(p.x, q.x)) return eq(p.y, q.y) ? null : vertical(p.x);
  const m = div(sub(q.y, p.y), sub(q.x, p.x));
  return fn(m, sub(p.y, mul(m, p.x)));
}

/** Recta de pendiente m que pasa por p: b = y₀ − m·x₀. */
export function fromPointSlope(p, m) {
  return fn(m, sub(p.y, mul(m, p.x)));
}

export function yAt(line, x) {
  if (line.kind !== "fn") throw new Error("yAt: una recta vertical no es función");
  return add(mul(line.m, x), line.b);
}

export function passesThrough(line, p) {
  return line.kind === "vertical" ? eq(p.x, line.x) : eq(p.y, yAt(line, p.x));
}

/**
 * Raíz (donde la recta corta al eje x):
 *   - fn con m ≠ 0: x = −b/m
 *   - fn horizontal: null si no lo corta (b ≠ 0); "todos" si es el propio eje x
 *   - vertical: x = c
 */
export function root(line) {
  if (line.kind === "vertical") return line.x;
  if (isZero(line.m)) return isZero(line.b) ? "todos" : null;
  return neg(div(line.b, line.m));
}

/** Paralela: misma pendiente (o misma clase de vertical) por el punto p. */
export function parallelThrough(line, p) {
  return line.kind === "vertical" ? vertical(p.x) : fromPointSlope(p, line.m);
}

/**
 * Perpendicular por p:
 *   m' = −1/m                    (si m ≠ 0)
 *   horizontal → vertical x = x₀ (¡no es función!)
 *   vertical   → horizontal y = y₀
 */
export function perpendicularThrough(line, p) {
  if (line.kind === "vertical") return fn(frac(0), p.y);
  if (isZero(line.m)) return vertical(p.x);
  return fromPointSlope(p, neg(div(ONE, line.m)));
}

export function equal(a, b) {
  if (a.kind !== b.kind) return false;
  return a.kind === "vertical" ? eq(a.x, b.x) : eq(a.m, b.m) && eq(a.b, b.b);
}

/** "y = 2x + 3", "y = (-1/2)x - 4", "y = -x", "y = 5", "x = 3". */
export function formatLine(line) {
  if (line.kind === "vertical") return `x = ${format(line.x)}`;
  const { m, b } = line;
  if (isZero(m)) return `y = ${format(b)}`;
  const coef = eq(m, frac(1)) ? "" : eq(m, frac(-1)) ? "-" : m.d === 1 ? format(m) : `(${format(m)})`;
  let s = `y = ${coef}x`;
  if (!isZero(b)) s += b.n < 0 ? ` - ${format(neg(b))}` : ` + ${format(b)}`;
  return s;
}

/**
 * Convierte lo que escribió el estudiante en una recta.
 *   { vertical: false, m: "2", b: "-3" }  → y = 2x − 3
 *   { vertical: true,  x: "4" }           → x = 4
 * Devuelve null si algún campo no se entiende.
 */
export function parseLineAnswer(a) {
  if (a.vertical) {
    const x = parseFrac(a.x ?? "");
    return x ? vertical(x) : null;
  }
  const m = parseFrac(a.m ?? "");
  const b = parseFrac(a.b ?? "");
  return m && b ? fn(m, b) : null;
}

/** Estado inicial de un campo LineAnswer. */
export const emptyLineAnswer = () => ({ vertical: false, m: "", b: "", x: "" });
