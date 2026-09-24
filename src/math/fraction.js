/* ---------------------------------------------------------------- */
/* Fracciones exactas                                                  */
/* ---------------------------------------------------------------- */
/* Una fracción es un objeto { n, d } con d > 0 y reducida al máximo.
   Se usa en lugar de decimales para que 1/3 sea exactamente 1/3 y las
   comparaciones ("¿la recta pasa por este punto?") nunca fallen por
   errores de redondeo. */

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error("frac: n y d deben ser enteros");
  if (d === 0) throw new Error("frac: el denominador no puede ser 0");
  const g = gcd(n, d);
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g || 0, d: (s * d) / g }; // "|| 0" evita el -0
}

export const ZERO = frac(0);
export const ONE = frac(1);

export const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
export const neg = (a) => frac(-a.n, a.d);

export function div(a, b) {
  if (b.n === 0) throw new Error("div: división por cero");
  return frac(a.n * b.d, a.d * b.n);
}

export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isZero = (a) => a.n === 0;
export const isInt = (a) => a.d === 1;
export const sign = (a) => Math.sign(a.n);
export const toNumber = (a) => a.n / a.d;

/** "3/2", "-4", "1/3" (siempre con "-" ASCII). */
export function format(a) {
  return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
}

/** Igual que format, pero entre paréntesis si es negativa o fraccionaria: "(-3)", "(1/2)", "4". */
export function paren(a) {
  return a.n < 0 || a.d !== 1 ? `(${format(a)})` : format(a);
}

/* ---------------------------------------------------------------- */
/* Lectura de lo que escribe el estudiante                             */
/* ---------------------------------------------------------------- */

function decimalToFrac(text) {
  const t = text.replace(",", ".");
  const negative = t.startsWith("-");
  const [int, dec = ""] = t.replace(/^[+-]/, "").split(".");
  const den = 10 ** dec.length;
  const num = Number(int) * den + (dec ? Number(dec) : 0);
  return frac((negative ? -1 : 1) * num, den);
}

/**
 * Acepta enteros, decimales con punto o coma y fracciones:
 *   "3", "-2", "0,75", "1.5", "3/2", "-1/3", "6/-4", "0.5/2"
 * Devuelve una fracción o null si no se entiende (o si divide por cero).
 */
export function parseFrac(input) {
  if (typeof input !== "string") return null;
  const s = input.replace(/\s+/g, "").replace(/[−–]/g, "-");
  const m = s.match(/^([+-]?\d+(?:[.,]\d+)?)(?:\/([+-]?\d+(?:[.,]\d+)?))?$/);
  if (!m) return null;
  const a = decimalToFrac(m[1]);
  if (m[2] === undefined) return a;
  const b = decimalToFrac(m[2]);
  return isZero(b) ? null : div(a, b);
}
