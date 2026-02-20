# Paquetes compartidos del monorepo

En este monorepo hay varios paquetes bajo `packages/` que pueden consumir **apps/web**, **apps/copilot** y otros proyectos.

## @bodasdehoy/memories

**Álbumes y fotos por evento.** Store Zustand + provider para inyectar API y usuario.

| | |
|--|--|
| **Ruta** | `packages/memories` |
| **Documentación** | [packages/memories/README.md](../packages/memories/README.md) |
| **Consumido por** | Copilot, apps/web (página Momentos), apps/memories-standalone |
| **Uso** | `<MemoriesProvider apiBaseUrl={...} userId={...} development={...}>` + `useMemoriesStore()` |

Instalación en una app: `"@bodasdehoy/memories": "workspace:*"` y `transpilePackages: ['@bodasdehoy/memories']` en Next.js.

---

## @bodasdehoy/wedding-creator

**Creador de webs para bodas y eventos.** Componentes de renderizado (WeddingSiteRenderer, secciones, paletas), tipos y hook de estado.

| | |
|--|--|
| **Ruta** | `packages/wedding-creator` |
| **Documentación** | [packages/wedding-creator/README.md](../packages/wedding-creator/README.md) |
| **Consumido por** | Copilot (wedding-creator, wedding/[slug]), apps/creador-standalone |
| **Uso** | `WeddingSiteRenderer`, `useWeddingWeb`, tipos `WeddingWebData`, etc. |

Instalación: `"@bodasdehoy/wedding-creator": "workspace:*"` y `transpilePackages: ['@bodasdehoy/wedding-creator']` en Next.js.

---

## Otros paquetes

- **packages/copilot-shared** — Componentes UI compartidos (ChatItem, InputEditor, etc.) para el chat. Ver README del monorepo y apps/copilot.

## Plan y estado

El plan detallado de los paquetes Memories y Creador (opción A, integración en Copilot/Web/standalones) está en **[PLAN-PAQUETES-MEMORIES-CREADOR.md](PLAN-PAQUETES-MEMORIES-CREADOR.md)**.

## Probar en local

Para que todo funcione en local, instala dependencias y luego ejecuta la verificación:

```bash
# 1. Instalar dependencias (obligatorio; desde la raíz)
pnpm install
# Si el lockfile no incluye los paquetes: pnpm install --no-frozen-lockfile

# 2. Verificación completa (typecheck + tests web + build standalones)
pnpm run verify:packages
```

O por pasos:

```bash
pnpm typecheck:packages   # Paquete memories (wedding-creator se comprueba en Copilot)
pnpm test:web             # Jest en apps/web (incl. test Memories)
pnpm test:memories        # Build de memories-standalone (smoke)
pnpm test:creador         # Build de creador-standalone (smoke)
# Opcional: pnpm --filter @bodasdehoy/copilot run test-app  (Vitest Copilot)
```

Builds y desarrollo:

```bash
pnpm build:memories && pnpm build:creador   # Standalones
pnpm build:web && pnpm build:copilot        # Apps principales
pnpm dev:memories   # http://localhost:3080
pnpm dev:creador    # http://localhost:3081 (incluye /preview)
```

## Testing y CI

Comandos de test por workspace (desde la raíz): ver tabla en [PLAN-PAQUETES-MEMORIES-CREADOR.md](PLAN-PAQUETES-MEMORIES-CREADOR.md#testing-por-workspace-comandos-desde-la-raíz).

- **CI:** [.github/workflows/ci-packages.yml](../.github/workflows/ci-packages.yml) ejecuta typecheck de paquetes, tests de Copilot (test-app), tests de web, y build de memories-standalone y creador-standalone.
- **Checklist pre-producción:** Ver [PLAN-PAQUETES-MEMORIES-CREADOR.md](PLAN-PAQUETES-MEMORIES-CREADOR.md#checklist-pre-producción-puesta-en-marcha).

## Despliegue y dominios (standalones)

Para poner en producción las apps que solo usan los paquetes:

| App | Despliegue | Dominio ejemplo | Variables en producción |
|-----|------------|-----------------|-------------------------|
| **memories-standalone** | Vercel / Node (next start) | `memories.bodasdehoy.com` | `NEXT_PUBLIC_MEMORIES_API_URL`, `NEXT_PUBLIC_DEVELOPMENT`; definir cómo se obtiene el usuario (ver README de la app). |
| **creador-standalone** | Vercel / Node (next start) | `creador.bodasdehoy.com` | `NEXT_PUBLIC_CHAT` (URL base de Copilot). |

Configurar en la plataforma de deploy (Vercel, etc.) las variables anteriores y el dominio; DNS debe apuntar al proyecto correspondiente.

## Próximos pasos (opcionales)

- Publicar `@bodasdehoy/memories` y `@bodasdehoy/wedding-creator` en un registro npm privado cuando otros monorepos (CRM, ERP) deban consumirlos sin workspace.
- Variables de entorno: ver `.env.example` (Memories, Creador standalone) y los README de cada app.
