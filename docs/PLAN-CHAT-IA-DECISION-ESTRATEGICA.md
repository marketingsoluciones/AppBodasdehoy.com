# chat-ia: diagnóstico honesto y decisión estratégica

> Tras semanas de problemas de compilación. Documento sin adornos para que decidas con datos.

## 1. El diagnóstico real (con datos)

| App del monorepo | Archivos | Deps | ¿Compila bien? |
|---|---|---|---|
| appEventos | 1.032 | 118 | ✅ Sí (:3220) |
| memories-web | 66 | — | ✅ Sí |
| editor-web | 6 | — | ✅ Sí |
| **chat-ia** | **2.942** | **357** | ❌ El problema (40.418 módulos/ruta, OOM en build) |

**El problema NO es el lenguaje ni la tecnología.** 3 de 4 apps compilan perfectamente.
El problema es **chat-ia: un fork completo de LobeChat** (357 deps, ~3× las demás).

## 2. Por qué "se rompió hace semanas"

NO fue un bug puntual. Fue la **acumulación de 78 commits de optimización** (SPRINT-AI…BO,
alias, tree-shaking, eliminar deps) entre ~2026-05-12 y hoy. Varios necesitaron `hotfix`/`revert`
(d20386e4, 205c5bc5, c7ca26a5). Resultado: chat-ia quedó **inestable y frágil al compilar**.
Se optimizó tanto y tan agresivo que se desestabilizó.

Causa de fondo permanente: **se forkeó LobeChat ENTERO para usar solo el chat.** Arrastra
features que no se usan (knowledge, discover, image, plugins, marketplace) + 357 deps.

## 3. Las 3 opciones reales (honestas)

### Opción A — Chat propio ligero (reemplazar LobeChat)
- Construir el chat IA mínimo propio. **Ya existe la base**: `packages/copilot-shared` +
  `CopilotEmbed` (appEventos ya lo usa y funciona).
- **Gana:** compila en segundos, ~50 deps en vez de 357, mantenible, sin features muertas.
- **Pierde:** features de LobeChat que no usáis igualmente.
- **Coste:** semanas. **Riesgo:** medio. **Resuelve el problema PARA SIEMPRE.**

### Opción B — Estabilizar el fork actual (parar de optimizar)
- DEJAR de optimizar (los sprints son la causa). Volver al último commit donde compilaba,
  o estabilizar el actual sin tocar más deps.
- **Gana:** menos trabajo, conserva todo. **Pierde:** sigue siendo pesado (40k módulos, lento).
- **Coste:** días. **Riesgo:** bajo. **NO resuelve la lentitud, solo la inestabilidad.**

### Opción C — Servir compilado (build una vez) → ❌ DESCARTADA (probada 2026-06-03)
- Se intentó build de prod en MacBook (24GB/18 cores, Firebase OK, heap 10GB).
- **RESULTADO: el build TUMBÓ el MacBook** — load average llegó a ~58, el sistema se
  REINICIÓ solo (uptime 2 min), build muerto sin completar. Confirmado tras el reinicio.
- **Conclusión dura:** chat-ia es tan pesado que su build de prod cuelga incluso una máquina
  de 24GB/18 cores. No es config ni ejecución — el fork está roto para compilar en hardware
  normal. La Opción C NO es viable. → refuerza que la solución real es A (chat propio ligero).

## 4. Recomendación honesta

**Corto plazo (esta semana): Opción C o B** — para que TENGÁIS chat-ia funcionando ya, sin
más días perdidos. Parar la sangría de optimización.

**Medio plazo (la solución real): Opción A** — el chat propio ligero. Es hacia donde ya
ibais (copilot-shared existe). LobeChat fue útil para arrancar rápido, pero su coste de
mantenimiento (357 deps, 78 sprints de pelea) ya superó su beneficio. Un chat propio sobre
vuestro backend (api-ia/api-mcp, que ya tenéis) sería una fracción del tamaño.

**NO cambiar de lenguaje/tecnología** — sería tirar el 75% que funciona por culpa de 1 componente.

## 5. Lo que NO se debe seguir haciendo

- ❌ Más "sprints de optimización" sobre el fork (son la causa de la inestabilidad).
- ❌ Más intentos de build a ciegas sin medir RAM.
- ❌ Reescribir todo el stack por frustración con un componente.
