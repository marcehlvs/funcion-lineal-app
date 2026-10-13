import { frac, add, mul, div, eq, isInt, toNumber } from "./fraction.js";
import { fn } from "./line.js";

/* ---------------------------------------------------------------- */
/* Proporcionalidad directa (p.d.) e inversa (p.i.)                    */
/* ---------------------------------------------------------------- */
/* Igual que generators.js: todo trabaja con fracciones exactas y todos los
   generadores reciben un rng para poder probarlos con semillas fijas.

   nivel = 1  → 1er año: solo números positivos y enteros "cómodos".
   nivel = 2/3 → 2do y 3er año: decimales, constantes fraccionarias, valores
                 negativos en los gráficos y problemas con un paso más. */

const F = (n, d = 1) => frac(n, d);
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const divisors = (n) => range(1, n).filter((d) => n % d === 0);

function sample(rng, arr, n) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

export const TIPOS = [
  { id: "directa", label: "Proporcionalidad directa" },
  { id: "inversa", label: "Proporcionalidad inversa" },
  { id: "ninguna", label: "Ninguna de las dos" },
];

/** Radio del plano en las solapas de gráficos. */
export const R_GRAF = 10;

/* ---------------------------------------------------------------- */
/* Formato                                                             */
/* ---------------------------------------------------------------- */

/** ¿La fracción tiene desarrollo decimal finito? (denominador de la forma 2^a·5^b) */
export function finiteDecimal(a) {
  let d = a.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

/** Número "para chicos": 5, 2,5, 0,75 y, si no queda otra, 7/3. */
export function fmt(a) {
  if (a.d === 1) return String(a.n);
  if (!finiteDecimal(a)) return `${a.n}/${a.d}`;
  let k = 0;
  while (10 ** k % a.d !== 0) k++;
  const scaled = a.n * (10 ** k / a.d);
  const s = String(Math.abs(scaled)).padStart(k + 1, "0");
  return `${scaled < 0 ? "-" : ""}${s.slice(0, -k)},${s.slice(-k)}`;
}

/* ---------------------------------------------------------------- */
/* Clasificar una tabla                                                */
/* ---------------------------------------------------------------- */

/** xs, ys: fracciones (x ≠ 0). Devuelve { tipo, k } con k = y/x (directa) o x·y (inversa). */
export function classify(xs, ys) {
  const cocientes = xs.map((x, i) => div(ys[i], x));
  const productos = xs.map((x, i) => mul(x, ys[i]));
  if (cocientes.every((c) => eq(c, cocientes[0]))) return { tipo: "directa", k: cocientes[0] };
  if (productos.every((p) => eq(p, productos[0]))) return { tipo: "inversa", k: productos[0] };
  return { tipo: "ninguna", k: null };
}

/* ---------------------------------------------------------------- */
/* Solapa 1 · ¿qué tipo de tabla es?                                   */
/* ---------------------------------------------------------------- */

const sortedInts = (rng, n, lo, hi) => sample(rng, range(lo, hi), n).sort((a, b) => a - b).map((x) => F(x));

function buildDirecta(nivel, n, rng) {
  const k = nivel === 1 ? F(int(rng, 2, 9)) : pick(rng, [F(3, 2), F(5, 2), F(1, 2), F(3, 4), F(7, 2), F(4), F(6)]);
  const xs = sortedInts(rng, n, 1, 12);
  return { xs, ys: xs.map((x) => mul(k, x)) };
}

function buildInversa(nivel, n, rng) {
  if (nivel === 1) {
    const k = pick(rng, [12, 18, 20, 24, 30, 36, 48, 60]);
    const xs = sample(rng, divisors(k), n).sort((a, b) => a - b).map((x) => F(x));
    return { xs, ys: xs.map((x) => div(F(k), x)) };
  }
  // x = d/2 con d divisor de 2k  →  y = 2k/d siempre entero, x con coma decimal
  const k = pick(rng, [6, 9, 12, 15, 18, 20, 24, 30]);
  const xs = sample(rng, divisors(2 * k), n).sort((a, b) => a - b).map((d) => F(d, 2));
  return { xs, ys: xs.map((x) => div(F(k), x)) };
}

function buildNinguna(nivel, n, rng) {
  const variantes = nivel === 1
    ? ["aditiva", "error-directa", "error-inversa"]
    : ["aditiva", "error-directa", "error-inversa", "cuadratica", "afin"];
  const variante = pick(rng, variantes);

  if (variante === "aditiva" || variante === "afin") {
    const a = variante === "aditiva" ? F(pick(rng, [1, 2, 3])) : pick(rng, [F(1, 2), F(3, 2), F(5, 2)]);
    const c = F(variante === "aditiva" ? int(rng, 1, 6) : pick(rng, [1, 2, 3, 5]));
    const xs = sortedInts(rng, n, 1, 10);
    return { xs, ys: xs.map((x) => add(mul(a, x), c)), variante };
  }
  if (variante === "cuadratica") {
    const xs = sortedInts(rng, n, 1, 8);
    return { xs, ys: xs.map((x) => mul(x, x)), variante };
  }
  // casi proporcional: una sola celda rota la regla
  const base = variante === "error-directa" ? buildDirecta(nivel, n, rng) : buildInversa(nivel, n, rng);
  const idx = int(rng, 0, n - 1);
  const ys = base.ys.map((y, i) => (i === idx ? add(y, F(pick(rng, [-3, -2, -1, 1, 2, 3]))) : y));
  if (ys[idx].n <= 0) return null;
  return { xs: base.xs, ys, variante };
}

export function genTablaTipo(nivel, rng = Math.random) {
  const tipo = pick(rng, ["directa", "inversa", "ninguna"]);
  const n = nivel === 1 ? 4 : 5;
  for (;;) {
    const t = tipo === "directa" ? buildDirecta(nivel, n, rng) : tipo === "inversa" ? buildInversa(nivel, n, rng) : buildNinguna(nivel, n, rng);
    if (!t) continue;
    const c = classify(t.xs, t.ys);
    if (c.tipo === tipo) return { tipo, k: c.k, xs: t.xs, ys: t.ys, variante: t.variante ?? tipo };
  }
}

/* ---------------------------------------------------------------- */
/* Solapa 2 · problemas de aplicación                                  */
/* ---------------------------------------------------------------- */
/* Cada plantilla de p.d. sortea { k, a1, a2, ctx } y de ahí salen
     b1 = k·a1 (dato), respuesta = k·a2.
   Cada plantilla de p.i. sortea { a1, b1, a2, ctx } y de ahí salen
     k = a1·b1 (dato), respuesta = k ÷ a2. */

const DIRECTAS = [
  {
    // precio por unidad
    draw(nivel, rng) {
      const item = pick(rng, [
        { q: "kg de naranjas", u: "kg" }, { q: "kg de papas", u: "kg" }, { q: "kg de harina", u: "kg" },
        { q: "litros de nafta", u: "litros" }, { q: "metros de cinta", u: "metros" }, { q: "metros de tela", u: "metros" },
      ]);
      if (nivel === 1) {
        return { k: F(pick(rng, [20, 30, 40, 50, 60, 80, 100, 120])), a1: F(int(rng, 2, 6)), a2: F(int(rng, 7, 12)), ctx: item };
      }
      return {
        k: F(pick(rng, [45, 65, 75, 85, 110, 130])),
        a1: pick(rng, [F(3, 2), F(5, 2), F(9, 2), F(5)]),
        a2: pick(rng, [F(3), F(4), F(15, 2), F(7, 2), F(6)]),
        ctx: item,
      };
    },
    text: (a1, b1, a2, c) => `${fmt(a1)} ${c.q} cuestan $${fmt(b1)}. ¿Cuánto cuestan ${fmt(a2)} ${c.u}?`,
    prefix: "$",
    constName: (c) => `Precio de 1 ${c.u === "kg" ? "kg" : c.u.slice(0, -1)} ($)`,
    constPrefix: "$",
  },
  {
    // distancia a velocidad constante
    draw(nivel, rng) {
      if (nivel === 1) return { k: F(pick(rng, [40, 50, 60, 80, 90])), a1: F(int(rng, 2, 4)), a2: F(int(rng, 5, 8)), ctx: null };
      return {
        k: F(pick(rng, [45, 65, 72, 85, 110])),
        a1: pick(rng, [F(3, 2), F(5, 2), F(2), F(3)]),
        a2: pick(rng, [F(4), F(9, 2), F(5), F(7, 2)]),
        ctx: null,
      };
    },
    text: (a1, b1, a2) => `Un auto viaja a velocidad constante y recorre ${fmt(b1)} km en ${fmt(a1)} horas. ¿Cuántos km recorre en ${fmt(a2)} horas?`,
    suffix: "km",
    constName: () => "Km recorridos por hora",
  },
  {
    // receta
    draw(nivel, rng) {
      if (nivel === 1) return { k: F(pick(rng, [50, 100, 150, 200])), a1: F(pick(rng, [2, 4, 5])), a2: F(pick(rng, [6, 8, 10, 12])), ctx: null };
      return { k: F(pick(rng, [75, 125, 150, 175])), a1: F(pick(rng, [3, 5, 6])), a2: F(pick(rng, [4, 9, 10, 15])), ctx: null };
    },
    text: (a1, b1, a2) => `Para una torta para ${fmt(a1)} personas se usan ${fmt(b1)} g de harina. ¿Cuántos gramos hacen falta para ${fmt(a2)} personas?`,
    suffix: "g",
    constName: () => "Gramos de harina por persona",
  },
];

const INVERSAS = [
  {
    // obreros y días
    draw(nivel, rng) {
      if (nivel === 1) return { a1: F(pick(rng, [2, 3, 4, 6])), b1: F(pick(rng, [6, 8, 10, 12, 15])), a2: F(pick(rng, [2, 3, 4, 5, 6, 8, 10, 12])), ctx: null };
      return { a1: F(pick(rng, [3, 4, 5, 6])), b1: F(pick(rng, [8, 10, 12, 15, 18])), a2: F(pick(rng, [4, 5, 8, 9, 10, 12, 15])), ctx: null };
    },
    text: (a1, b1, a2) => `${fmt(a1)} obreros tardan ${fmt(b1)} días en terminar un muro. Si todos trabajan al mismo ritmo, ¿cuántos días tardarán ${fmt(a2)} obreros?`,
    suffix: "días",
    constName: () => "Días que tardaría 1 solo obrero",
    constStep: "obreros · días",
  },
  {
    // velocidad y tiempo
    draw(nivel, rng) {
      const v = [30, 40, 60, 80, 90, 120];
      return { a1: F(pick(rng, v)), b1: F(pick(rng, nivel === 1 ? [2, 3, 4, 6] : [3, 4, 5, 6, 9])), a2: F(pick(rng, v)), ctx: null };
    },
    text: (a1, b1, a2) => `Un auto que va a ${fmt(a1)} km/h tarda ${fmt(b1)} horas en llegar a destino. ¿Cuántas horas tardará si va a ${fmt(a2)} km/h?`,
    suffix: "horas",
    constName: () => "Distancia total (km)",
    constStep: "km/h · horas",
  },
  {
    // caramelos para repartir
    draw(nivel, rng) {
      return { a1: F(pick(rng, [4, 5, 6, 8])), b1: F(pick(rng, nivel === 1 ? [6, 9, 10, 12, 15] : [6, 9, 10, 14, 15, 18])), a2: F(pick(rng, [2, 3, 4, 5, 6, 9, 10, 12, 15])), ctx: null };
    },
    text: (a1, b1, a2) => `En una fiesta, ${fmt(a1)} chicos se reparten caramelos en partes iguales y a cada uno le tocan ${fmt(b1)}. Si en cambio fueran ${fmt(a2)} chicos, ¿cuántos caramelos le tocarían a cada uno?`,
    suffix: "caramelos",
    constName: () => "Cantidad total de caramelos",
    constStep: "chicos · caramelos",
  },
  {
    // bombas
    draw(nivel, rng) {
      return { a1: F(pick(rng, [2, 3, 4])), b1: F(pick(rng, [6, 8, 10, 12])), a2: F(pick(rng, [3, 4, 5, 6, 8, 12])), ctx: null };
    },
    text: (a1, b1, a2) => `${fmt(a1)} bombas iguales vacían una pileta en ${fmt(b1)} horas. ¿Cuántas horas tardarían ${fmt(a2)} bombas?`,
    suffix: "horas",
    constName: () => "Horas que tardaría 1 sola bomba",
    constStep: "bombas · horas",
  },
];

const NINGUNAS = [
  {
    niveles: [1, 2, 3],
    texto: "Lucía mide 1,20 m a los 8 años. ¿Es cierto que a los 16 años (el doble de edad) va a medir 2,40 m (el doble de altura)?",
    explicacion: "La altura de una persona no crece de forma proporcional a su edad: duplicar la edad no duplica la altura. No es ni p.d. ni p.i.",
  },
  {
    niveles: [1, 2, 3],
    texto: "Juan tiene 10 años y su hermana tiene 4. ¿Es cierto que cuando Juan tenga 20 años (el doble) su hermana va a tener 8 (el doble)?",
    explicacion: "La diferencia de edades siempre es de 6 años: cuando Juan tenga 20, ella va a tener 14. Se trata de una suma constante, no de una proporcionalidad.",
  },
  {
    niveles: [2, 3],
    texto: "Un taxi cobra $1200 de bajada de bandera más $300 por km. Un viaje de 2 km cuesta $1800 y uno de 4 km cuesta $2400. ¿El precio es directamente proporcional a los km?",
    explicacion: "Los cocientes precio ÷ km son 900 y 600: no son iguales. Con 0 km ya se paga $1200, así que la gráfica no pasa por el origen: es una función lineal, pero no de proporcionalidad directa.",
  },
  {
    niveles: [2, 3],
    texto: "Un cuadrado de lado 2 cm tiene un área de 4 cm². Si el lado se duplica (4 cm), el área es de 16 cm². ¿El área es directamente proporcional al lado?",
    explicacion: "Al duplicar el lado el área se multiplica por 4, no por 2. Los cocientes área ÷ lado son 2 y 4: no son constantes.",
  },
];

function tryDirecta(nivel, rng) {
  const t = pick(rng, DIRECTAS);
  const { k, a1, a2, ctx } = t.draw(nivel, rng);
  if (eq(a1, a2)) return null;
  const b1 = mul(k, a1);
  const ans = mul(k, a2);
  if (!finiteDecimal(ans) || !finiteDecimal(b1)) return null;
  return {
    tipo: "directa",
    texto: t.text(a1, b1, a2, ctx),
    answer: ans,
    prefix: t.prefix,
    suffix: t.suffix,
    k,
    constName: t.constName(ctx),
    constPrefix: t.constPrefix,
    steps: [
      `Constante de proporcionalidad: k = ${fmt(b1)} ÷ ${fmt(a1)} = ${fmt(k)}`,
      `Respuesta: ${fmt(k)} · ${fmt(a2)} = ${fmt(ans)}`,
    ],
  };
}

function tryInversa(nivel, rng) {
  const t = pick(rng, INVERSAS);
  const { a1, b1, a2, ctx } = t.draw(nivel, rng);
  if (eq(a1, a2)) return null;
  const k = mul(a1, b1);
  const ans = div(k, a2);
  if (!finiteDecimal(ans)) return null;
  if (nivel === 1 && !isInt(ans)) return null;
  return {
    tipo: "inversa",
    texto: t.text(a1, b1, a2, ctx),
    answer: ans,
    suffix: t.suffix,
    k,
    constName: t.constName(ctx),
    steps: [
      `Constante de proporcionalidad: k = ${t.constStep} = ${fmt(a1)} · ${fmt(b1)} = ${fmt(k)}`,
      `Respuesta: ${fmt(k)} ÷ ${fmt(a2)} = ${fmt(ans)}`,
    ],
  };
}

/** { tipo, texto, answer, prefix, suffix, k, constName, steps } — o, si tipo = "ninguna", { texto, explicacion }. */
export function genProblema(nivel, rng = Math.random) {
  if (rng() < 0.2) {
    const t = pick(rng, NINGUNAS.filter((p) => p.niveles.includes(nivel)));
    return { tipo: "ninguna", texto: t.texto, explicacion: t.explicacion, answer: null, k: null };
  }
  for (;;) {
    const p = rng() < 0.5 ? tryDirecta(nivel, rng) : tryInversa(nivel, rng);
    if (p) return p;
  }
}

/* ---------------------------------------------------------------- */
/* Solapa 3 · gráficos                                                 */
/* ---------------------------------------------------------------- */

function poolDirecta(k) {
  return range(1, R_GRAF).filter((x) => x % k.d === 0 && (k.n * x) / k.d <= R_GRAF);
}
function poolInversa(k) {
  return divisors(k.n).filter((x) => x <= R_GRAF && k.n / x <= R_GRAF);
}

/** Puntos enteros (números, no fracciones) que caen dentro del plano. */
function genPuntos(tipo, k, nivel, rng, cuantos) {
  const pos = tipo === "directa" ? poolDirecta(k) : poolInversa(k);
  let xs;
  if (nivel === 1) {
    xs = sample(rng, pos, Math.min(cuantos, pos.length));
  } else {
    const np = Math.ceil(cuantos / 2);
    xs = [...sample(rng, pos, Math.min(np, pos.length)), ...sample(rng, pos, Math.min(cuantos - np, pos.length)).map((x) => -x)];
  }
  xs.sort((a, b) => a - b);
  return xs.map((x) => ({ x, y: tipo === "directa" ? (k.n * x) / k.d : k.n / x }));
}

const kDirecta = (nivel, rng) => (nivel === 1 ? F(pick(rng, [1, 2, 3])) : pick(rng, [F(1), F(2), F(3), F(1, 2), F(3, 2), F(5, 2)]));
const kInversa = (nivel, rng) => F(pick(rng, nivel === 1 ? [6, 8, 10, 12, 16, 18, 20, 24] : [6, 8, 12, 16, 18, 24]));

/** Ramas de la hipérbola x·y = k, como listas de puntos para dibujar. both = incluir la rama negativa. */
export function hyperbolaBranches(k, both) {
  const kk = toNumber(k);
  const pos = [];
  for (let x = 0.15; x <= R_GRAF + 1; x += 0.05) pos.push({ x, y: kk / x });
  return both ? [pos, pos.map((p) => ({ x: -p.x, y: -p.y }))] : [pos];
}

/** Para "Graficá la tabla": { tipo, k, pts, positivo }. */
export function genGraficar(nivel, rng = Math.random) {
  const tipo = pick(rng, ["directa", "inversa"]);
  const k = tipo === "directa" ? kDirecta(nivel, rng) : kInversa(nivel, rng);
  return { tipo, k, pts: genPuntos(tipo, k, nivel, rng, 4), positivo: nivel === 1 };
}

/** Para "Interpretá el gráfico": { tipo, k, pts, lines, curves, positivo }. */
export function genInterpretar(nivel, rng = Math.random) {
  const positivo = nivel === 1;
  const tipo = pick(rng, ["directa", "inversa", "ninguna"]);

  if (tipo === "directa") {
    const k = kDirecta(nivel, rng);
    return { tipo, k, pts: genPuntos(tipo, k, nivel, rng, 3), lines: [{ line: fn(k, F(0)), color: "#E8B33D" }], curves: [], positivo };
  }
  if (tipo === "inversa") {
    const k = kInversa(nivel, rng);
    return { tipo, k, pts: genPuntos(tipo, k, nivel, rng, 3), lines: [], curves: hyperbolaBranches(k, !positivo).map((pts) => ({ pts, color: "#E8B33D" })), positivo };
  }

  // ninguna: recta que no pasa por el origen (siempre) o parábola (2º y 3º año)
  if (nivel > 1 && rng() < 0.5) {
    const curve = [];
    for (let x = -R_GRAF - 1; x <= R_GRAF + 1; x += 0.1) curve.push({ x, y: (x * x) / 4 });
    const pts = sample(rng, [-6, -4, -2, 2, 4, 6], 3).sort((a, b) => a - b).map((x) => ({ x, y: (x * x) / 4 }));
    return { tipo, k: null, pts, lines: [], curves: [{ pts: curve, color: "#E8B33D" }], positivo };
  }
  const a = nivel === 1 ? pick(rng, [1, 2]) : pick(rng, [1, 2, -1, -2]);
  const c = nivel === 1 ? pick(rng, [1, 2, 3]) : pick(rng, [-4, -3, -2, -1, 1, 2, 3, 4]);
  const xsPool = (nivel === 1 ? range(1, 4) : range(-5, 5)).filter((x) => x !== 0 && Math.abs(a * x + c) <= R_GRAF);
  const pts = sample(rng, xsPool, 3).sort((x, y) => x - y).map((x) => ({ x, y: a * x + c }));
  return { tipo, k: null, pts, lines: [{ line: fn(F(a), F(c)), color: "#E8B33D" }], curves: [], positivo };
}
