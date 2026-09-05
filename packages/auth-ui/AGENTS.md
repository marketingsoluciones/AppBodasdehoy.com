# `@bodasdehoy/auth-ui` — Guía para agentes IA

UI compartida del login unificado. Solo presentación, ningún side-effect de auth.

## Qué exporta

- `SplitLoginPage` — layout split-screen completo (banner izq + form der). Props `LeftPanelConfig`, `SplitLoginPageProps`.
- `LoginForm` — formulario solo (sin layout). Props `LoginFormProps`.

Consumer principal: `apps/appEventos/pages/login.js`.

## Cómo añadir features

1. Edita `src/SplitLoginPage.tsx` o `src/LoginForm.tsx`.
2. Exporta tipos/componentes nuevos en `src/index.ts`.
3. Build: `pnpm --filter @bodasdehoy/auth-ui build` (emite dist/).
4. Si añades dependencia con side-effects (analytics, etc.), márcala como `peerDependency` para que el consumer la controle.

## Reglas

- **Stateless/controlled**: el componente NO debe llamar API ni leer cookies. Recibe handlers como props.
- **No firebase aquí**: el auth real vive en `apps/chat-ia/src/services/firebase-auth/`. auth-ui solo renderiza.
- **Build → dist/**: `main: ./dist/index.js`. NO consumir directamente desde `src/` en producción (Vercel build fallaría sin dist).
- **TypeScript estricto**, target ES2022, `moduleResolution: "Bundler"`.

## Verificación

Tras cambios, validar:
```bash
pnpm --filter @bodasdehoy/auth-ui build         # debe emitir dist/
curl -I http://localhost:3220/login              # appEventos /login = 200
```
