# Datos copiados de repositorios públicos

Ambos archivos se copiaron de repositorios públicos de GitHub para
dar respaldo local a funcionalidades que dependen de APIs externas
(ver `AGENTS.md` del proyecto: nada de llaves ni registros).

## `fruityvice.json`

- **De:** `github.com/alessandra-torelli/fruitpedia` →
  `src/assets/data/fruityvice.json`
- **Qué es:** las 40 frutas del API público Fruityvice
  (www.fruityvice.com) con su nutrición por 100 g.
- **Para qué:** respaldo sin red de `nutricionDe`
  (`src/lib/fruta.functions.ts`). Cuando Fruityvice no responde,
  la ficha de nutrición contesta con estos datos locales y la UI
  lo dice (`source: "local"`).

## `foodkeeper-ingredients.csv`

- **De:** `github.com/jelera/food-shelflife-db` (licencia MIT) →
  `lib/seeds/ingredients.csv`
- **Qué es:** el volcado de USDA FoodKeeper / FSIS: 663 alimentos
  con rangos de alacena, refrigerador y congelador. Es la misma
  fuente que el README de la app ya cita.
- **Para qué:** `conservacionDe` (`src/lib/conservacion.functions.ts`)
  da días de conservación USDA a productos de tienda (Open Food
  Facts) que aún no tienen ficha en la guía. Datos locales, sin
  red y sin llave.

## Actualizar las copias

```sh
curl -sL "https://raw.githubusercontent.com/alessandra-torelli/fruitpedia/main/src/assets/data/fruityvice.json" -o src/lib/data/fruityvice.json
curl -sL "https://raw.githubusercontent.com/jelera/food-shelflife-db/main/lib/seeds/ingredients.csv" -o src/lib/data/foodkeeper-ingredients.csv
```
