# Guía Fresca

Guía en español para saber qué frutas, verduras y lácteos van dentro o fuera del refrigerador, cómo se ven cuando están listos y cuántos días duran.

Los tiempos de hogar siguen USDA FoodKeeper, la tabla de Virginia Tech (348-960) y la regla de las 2 horas de FDA. La búsqueda de productos de tienda consulta Open Food Facts, sin llave.

Lo que se guarda (favoritos y ajustes) se queda en el teléfono. No hay cuentas.

Node declarado: 24.x

## Sistema de interacción

Todo el comportamiento táctil y de teclado vive en piezas reutilizables, con las decisiones
difíciles fuera de React para poder probarlas sin navegador:

| Pieza                                               | Para qué                                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/interaction.ts`                            | Decisiones puras: bloqueo de eje (1.2), umbral de swipe, teclado de pestañas y radios, búsqueda sin diacríticos, señales de desborde, días de conservación. |
| `src/lib/interaction.test.ts`                       | 38 comprobaciones de esas decisiones (`npm test`).                                                                                                          |
| `src/lib/use-pan.ts`                                | Arrastre con bloqueo de eje sobre Pointer Events; ignora controles anidados y anula el clic que sigue a un arrastre.                                        |
| `src/lib/use-overflow-rail.ts`                      | Carril horizontal: desborde real, centrado de la opción elegida, desplazamiento suave salvo con movimiento reducido.                                        |
| `src/lib/announcer.ts` + `src/components/decor.tsx` | Región viva única: lo que se ve (“Guardado”, “3 fichas”) también se oye.                                                                                    |
| `src/lib/toasts.ts` + `src/components/toaster.tsx`  | Avisos con “Deshacer”, fuera de React para usarse desde cualquier componente.                                                                               |
| `src/components/tabs.tsx`                           | Pestañas con `tablist`/`tab`/`tabpanel`, indicador deslizante, flechas/Inicio/Fin y cambio de panel por gesto horizontal.                                   |
| `src/components/chips.tsx`                          | Filtros con semántica de grupo de radios, carril con imán y señales de desborde.                                                                            |
| `src/components/cards.tsx`                          | Tarjetas, carrusel en móvil → cuadrícula en pantallas grandes, termómetro de conservación.                                                                  |
| `src/components/swipe-reveal.tsx`                   | Tarjeta que se desliza para revelar acciones: siempre con alternativa visible (botón “⋯” en táctil, acciones a la vista en escritorio).                     |
| `src/components/combobox.tsx`                       | Combobox con búsqueda (flechas, Inicio/Fin, Enter, Escape, sin coincidencias, cierre al tocar fuera).                                                       |
| `src/components/accordion.tsx`                      | Paneles plegables con altura animada y estado accesible.                                                                                                    |
| `src/components/actions.tsx`                        | Botón con los cinco estados (inactivo, cargando, éxito, error, deshabilitado), interruptor `role="switch"` y botón de guardar con chispas.                  |
| `src/styles.css`                                    | Tokens de color, duración y curva; microinteracciones y el bloque único de `prefers-reduced-motion`.                                                        |

Reglas que se sostienen en todo el proyecto: objetivos táctiles de 44 px, `touch-action:
manipulation` en controles, movimiento reducido que apaga lo decorativo sin quitar nada usable, y
estados nunca explicados solo con color.

## APIs públicas (sin llave ni registro)

- **Open-Meteo** — clima y geocoding de la ciudad (`src/lib/clima.functions.ts`).
- **Open Food Facts** — productos reales de tienda (`src/lib/products.functions.ts`).
- **Fruityvice** — nutrición por fruta (`src/lib/fruta.functions.ts`).
- **ipapi.co** — ciudad aproximada por IP, solo al tocar “Usar mi ubicación” (`src/lib/location.functions.ts`).

Todas pasan por una caché de dos niveles (`src/lib/cache.ts`): memoria por instancia + tabla
`cache_entry` en Postgres (`migrations/0002_cache_entry.sql`, con índice en `expires_at` para
el barrido de caducados), así sobreviven a los cold starts de Vercel.

## Datos copiados de GitHub

Ver `src/lib/data/README.md`. Respaldo local de Fruityvice (nutrición sin red) y la tabla
USDA FoodKeeper de `jelera/food-shelflife-db` (MIT) para dar días de conservación USDA a
productos de tienda que aún no tienen ficha (`src/lib/conservacion.functions.ts`).

## Verificación de tiempos

Cada producto tiene su fuente en `src/lib/verificacion.ts`: tabla, fila exacta y rangos. La ficha lo muestra en "Cómo se comprobó".

- **USDA FoodKeeper** (32 productos): la cifra debe ser igual a la fila de `src/lib/data/foodkeeper-ingredients.csv`.
- **Virginia Tech 348-960** (6) y **SDSU** (1): cifra leída de la publicación.
- **Criterio de la guía** (23): sin cifra comparable en las tablas; se muestra como criterio.

Si la tabla da un tiempo distinto al de la guía, la fuente debe llevar `excepcion`.

Para correr las comprobaciones: `npm run check:guia`.
