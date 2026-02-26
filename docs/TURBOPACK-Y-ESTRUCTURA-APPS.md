# Turbopack (Copilot) y estructura de apps

## 1. Por qué Turbopack puede ir lento en Copilot

El proyecto **Copilot** (LobeChat) es muy grande: muchos paquetes internos (`packages/*`), `transpilePackages` (pdfjs-dist, mermaid, @bodasdehoy/wedding-creator), locales, y config que en el propio `next.config.ts` indica que con **Turbopack** y paquetes externos puede dar errores de bundle.

**Qué scripts hay en Copilot:**
- **`dev`** (recomendado): `next dev -H 0.0.0.0 -p 3210` → **sin** Turbopack (Webpack).
- **`dev:turbo`**: `next dev --turbopack ...` → con Turbopack.

**Recomendación para ganar velocidad y estabilidad:** usar **`dev`** (sin Turbopack). En este monorepo, el dev con Webpack ya tiene cache en disco (`.next/cache/webpack`) y paralelismo limitado para no saturar memoria; Turbopack en proyectos tan grandes a veces va más lento en el arranque o da más problemas.

**Desde la raíz del monorepo:**
```bash
pnpm dev:copilot        # usa "dev" de Copilot → sin Turbopack
# o solo Copilot:
cd apps/copilot && pnpm dev
```

**Si aun así quieres probar Turbopack:**
```bash
cd apps/copilot && pnpm dev:turbo
```
Si va lento o falla, vuelve a `pnpm dev`.

---

## 2. Estructura: App Bodas y Copilot están en la misma carpeta `apps`

**Ambos proyectos están bajo `apps/`:**

| App              | Ruta en el repo      | Descripción                    |
|------------------|----------------------|--------------------------------|
| **Copilot**      | `apps/copilot`       | LobeChat, chat IA, mensajería  |
| **App Bodasdehoy** (web) | `apps/web` | Páginas bodas, invitados, proxy chat |
| Memories standalone | `apps/memories-standalone` | App standalone Memorias |
| Creador standalone | `apps/creador-standalone` | App standalone Creador web |

No hay un "proyecto appbodas" fuera de `apps/`: **App Bodasdehoy es `apps/web`** y está en la misma carpeta `apps` que `apps/copilot`.

**Desde la raíz:**
```bash
pnpm dev:web      # arranca apps/web (App Bodas)
pnpm dev:copilot  # arranca apps/copilot
pnpm dev          # arranca en paralelo web + copilot
```

Si en algún script o doc se nombra "appbodas" como algo distinto de `apps/web`, es el mismo proyecto: **apps/web** = App Bodasdehoy.
