This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Flujo de trabajo: local → aprobación → rama `test` → Vercel

| Dónde | Qué es |
|--------|--------|
| **Local** | Aquí se desarrolla y se **valida todo el código**: que compile, que los tests/lint que uséis pasen y que la app se vea bien en `pnpm dev` / `pnpm dev:local` (raíz del monorepo). |
| **Rama `test`** | Solo cuando **esté aprobado lo probado en local**. Los pushes a `test` son los que **Vercel** usa para desplegar hacia **`app-test`**. No subir a `test` trabajo a medias. |

**Orden recomendado**

1. Trabajar y revisar **en local** hasta que el cambio esté listo (incluidos tests si aplica).
2. **Aprobar** ese estado en local.
3. **Entonces** merge/push a **`test`** para que Vercel genere el deploy de staging.
4. Comprobar en **`https://app-test.bodasdehoy.com`** que en dominio real sigue bien (cookies, login, Copilot).

> **Cuidado:** la rama `test` no es “otro sitio para programar”: es el **canal hacia Vercel**. Lo que subáis ahí puede quedar publicado en `-test` para el equipo.

## Local vs entorno `-test` (análisis rápido)

| | **Desarrollo local** | **Subido / desplegado (`*-test`)** |
|---|----------------------|-------------------------------------|
| **URL típica** | `localhost` / `127.0.0.1` (puerto del `pnpm dev` de esta app, p. ej. 3220 o el que uses con proxy) | `https://app-test.bodasdehoy.com` (sin puerto en el navegador si hay túnel/proxy) |
| **Chat / Copilot** | Origen según `.env` (`NEXT_PUBLIC_CHAT`) o resolución por hostname; en local a menudo chat en otro puerto | `https://chat-test.bodasdehoy.com` (configuración del hosting + `NEXT_PUBLIC_CHAT`) |
| **Cookies / SSO** | En `localhost` las cookies con `domain=.bodasdehoy.com` no aplican igual; el código trata el host local aparte (`AuthContext`, login) | Mismo dominio base `bodasdehoy.com`: cookies y SSO entre `app-test` y `chat-test` encajan mejor |
| **Qué validar al pasar a `-test`** | Flujo y UI en tu máquina | Misma build pero **hostname real**: login, Copilot embebido, APIs y CORS; es el entorno que suelen usar E2E (`BASE_URL=https://app-test.bodasdehoy.com`) |

**Resumen:** en local trabajas el código y el puerto; **cuando la web “sube” al dominio `app-test`**, el comportamiento relevante (auth, chat, cookies) pasa a depender del **hostname `*-test`** y de las variables del despliegue, no de `localhost`.

## Copilot embebido (sidebar)

- Código principal: `components/ChatSidebar/ChatSidebarDirect.tsx`.
- **Móvil** (&lt;768px): drawer, `html`/`body` sin scroll mientras está abierto, `role="dialog"`, selector de conversación + **Nueva**. Cerrar: backdrop, **Escape** (listener en `ChatSidebarProvider`).
- **Teclado virtual**: `CopilotEmbed` usa `useVisualViewportKeyboardInset` para padding inferior del input cuando el teclado reduce el `VisualViewport`.
- **Escritorio**: panel de conversaciones opcional; preferencia `localStorage` → `copilot_sessions_panel_collapsed`.
