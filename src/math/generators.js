import { frac, neg, div, toNumber } from "./fraction.js";
import {
  pt,
  fn,
  fromPoints,
  yAt,
  passesThrough,
  parallelThrough,
  perpendicularThrough,
} from "./line.js";

/* Todos los generadores reciben un rng (por defecto Math.random) para poder
   probarlos con semillas fijas. */

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const F = (n, d = 1) => frac(n, d);

/** Radio del plano cartesiano: se dibuja de −PLANE_R a +PLANE_R. */
export const PLANE_R = 10;

/* ---------- Solapa 1 · tabla ---------- */

/**
 * y = m·x + b con 5 valores de x. Si m tiene denominador d, los x son
 * múltiplos de d, así todos los y salen enteros y se pueden ubicar en la
 * cuadrícula. Se rechaza todo ejercicio con puntos fuera del plano.
 */
export function genTabla(rng = Math.random) {
  const slopes = [F(1), F(2), F(3), F(-1), F(-2), F(-3), F(1, 2), F(-1, 2), F(3, 2), F(-3, 2)];
  for (;;) {
    const m = pick(rng, slopes);
    const b = F(int(rng, -6, 6));
    const xs = [-2, -1, 0, 1, 2].map((k) => F(k * m.d));
    const line = fn(m, b);
    const ys = xs.map((x) => yAt(line, x));
    if (ys.every((y) => Math.abs(toNumber(y)) <= PLANE_R - 1)) return { line, xs, ys };
  }
}

/* ---------- Solapa 2 · raíz y ordenada al origen ---------- */

/** La recta corta a los ejes en (x₀, 0) y (0, b), con x₀ y b enteros no nulos. */
export function genRaizOrdenada(rng = Math.random) {
  const nonZero = () => {
    const v = int(rng, 1, 6);
    return rng() < 0.5 ? -v : v;
  };
  const x0 = F(nonZero());
  const b = F(nonZero());
  const m = neg(div(b, x0));
  return { x0, b, line: fn(m, b) };
}

/* ---------- Solapa 3 · recta por dos puntos ---------- */

/** Dos puntos enteros. De vez en cuando comparten x → recta vertical (sin pendiente). */
export function genDosPuntos(rng = Math.random) {
  for (;;) {
    const p = pt(F(int(rng, -6, 6)), F(int(rng, -6, 6)));
    let q = pt(F(int(rng, -6, 6)), F(int(rng, -6, 6)));
    if (rng() < 0.12) q = pt(p.x, F(int(rng, -6, 6)));
    const line = fromPoints(p, q);
    if (!line) continue;
    if (line.kind === "fn" && Math.abs(toNumber(line.m)) > 4) continue;
    return { p, q, line };
  }
}

/* ---------- Solapa 4 · paralelas y perpendiculares ---------- */

const REF_SLOPES = [
  F(1), F(2), F(3), F(-1), F(-2), F(-3),
  F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(-2, 3), F(3, 2), F(-3, 2),
];

/**
 * Una recta de referencia y un punto que NO está sobre ella. De vez en cuando
 * la referencia es horizontal, y entonces la perpendicular es vertical.
 */
export function genParPerp(rng = Math.random) {
  for (;;) {
    const m = rng() < 0.12 ? F(0) : pick(rng, REF_SLOPES);
    const line = fn(m, F(int(rng, -4, 4)));
    const p = pt(F(int(rng, -6, 6)), F(int(rng, -6, 6)));
    if (passesThrough(line, p)) continue;
    return { line, p, par: parallelThrough(line, p), perp: perpendicularThrough(line, p) };
  }
}

/* ---------- Solapa 5 · desafío "Apuntá a las estrellas" ---------- */

/**
 * Niveles que rotan: 0 = pasar por 3 estrellas, 1 = paralela por una estrella,
 * 2 = perpendicular por una estrella. Las pendientes se limitan a múltiplos de
 * 1/4 (lo que permite el control deslizante), y con el avance se suman más.
 */
export function genLevel(n, rng = Math.random) {
  const type = ["points", "parallel", "perpendicular"][n % 3];
  const tier = Math.min(2, Math.floor(n / 3));
  const pool = [F(1), F(-1), F(2), F(-2)];
  if (tier >= 1) pool.push(F(1, 2), F(-1, 2));
  if (tier >= 2) pool.push(F(4), F(-4));

  for (;;) {
    const m = pick(rng, pool);
    const b = F(int(rng, -5, 5));
    const line = fn(m, b);

    if (type === "points") {
      // x múltiplos del denominador para que las estrellas caigan en la cuadrícula
      const candidates = [];
      for (let x = -8; x <= 8; x++) {
        if (x % m.d !== 0) continue;
        const y = yAt(line, F(x));
        if (Math.abs(toNumber(y)) <= PLANE_R - 1) candidates.push(pt(F(x), y));
      }
      if (candidates.length < 3) continue;
      const stars = [];
      while (stars.length < 3) {
        const c = pick(rng, candidates);
        if (!stars.includes(c)) stars.push(c);
      }
      return { type, target: line, stars, reference: null };
    }

    const p = pt(F(int(rng, -7, 7)), F(int(rng, -7, 7)));
    if (passesThrough(line, p)) continue;
    const target = type === "parallel" ? parallelThrough(line, p) : perpendicularThrough(line, p);
    // el objetivo debe poder armarse con los controles: pendiente múltiplo de 1/4, |b| ≤ 10
    if (target.kind !== "fn") continue;
    if (target.m.d > 4 || 4 % target.m.d !== 0) continue;
    if (Math.abs(toNumber(target.b)) > 10 || 4 % target.b.d !== 0) continue;
    return { type, target, stars: [p], reference: line };
  }
}

