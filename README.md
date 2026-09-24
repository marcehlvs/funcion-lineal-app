# Rectas en acción

App para practicar **funciones lineales**: tabla de valores, raíz y ordenada al origen,
recta por dos puntos (pendiente y ordenada), rectas paralelas y perpendiculares, y un
desafío con estrellas. Hecha con React + Vite, con la misma estética de pizarrón que
[estadistica-app](https://github.com/marcehlvs/estadistica-app).

## Comandos

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # compila a dist/
npm run lint
npm run deploy    # compila y publica en GitHub Pages (rama gh-pages)
```

> El sitio publicado **solo se actualiza con `npm run deploy`**; subir a `main` no alcanza.

## Estructura

```
src/
  math/
    fraction.js    Fracciones exactas (sin errores de decimales) + lectura de "3/2", "0,75"…
    line.js        Modelo de recta: por dos puntos, raíz, paralela, perpendicular, vertical
    generators.js  Generadores de ejercicios (todos aceptan un rng para poder probarlos)
  components/
    Plano.jsx      Plano cartesiano en SVG: rectas, puntos, estrellas, clic y arrastre
    ui.jsx         AnswerInput, LineAnswer (con caso vertical), Legend
  tabs/            Una solapa por archivo (Tabla, RaizOrdenada, DosPuntos, ParPerp, Desafio)
  styles.css       Paleta de pizarrón
```

## Decisiones de diseño

- **Fracciones exactas:** la pendiente 1/3 se guarda como 1/3, nunca como 0.333…, así
  "¿pasa por este punto?" nunca falla por redondeo.
- **La recta vertical es un caso propio** (`x = c`): no tiene pendiente y no es función.
  Aparece en "Dos puntos" y como perpendicular a una recta horizontal.
- **Desafío:** pendiente y ordenada avanzan de a 1/4, y los niveles se generan solo con
  objetivos que se pueden armar con esos controles.
