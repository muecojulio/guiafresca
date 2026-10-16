# Guía Fresca

Guía en español para saber qué frutas, verduras y lácteos van dentro o fuera del refrigerador, cómo se ven cuando están listos y cuántos días duran.

Los tiempos de hogar siguen USDA FoodKeeper, la tabla de Virginia Tech (348-960) y la regla de las 2 horas de FDA. La búsqueda de productos de tienda consulta Open Food Facts, sin llave.

Lo que se guarda (favoritos y ajustes) se queda en el teléfono. No hay cuentas.

Node declarado: 24.x

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
