# Checklist: Despliegue app-test con Copilot

Pasos concretos para desplegar `apps/web` (app-test) con el Copilot embed funcionando.

---

## 1. Variables de entorno (entorno de app-test)

| Variable | Obligatoria | Valor típico |
|----------|-------------|--------------|
| `PYTHON_BACKEND_URL` | Sí | URL del backend api-ia (ej. `https://api-ia.bodasdehoy.com`) |
| `API_IA_CHAT_HISTORY_URL` | No** | Si api-ia expone historial (ver docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md), ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`. Si está definida, el front no llama a API2 para historial. |
| `API2_GRAPHQL_URL` | No* | URL GraphQL de API2; solo se usa para historial si `API_IA_CHAT_HISTORY_URL` no está definida. |
| `SKIP_WHITELABEL_VIA_API2` | No | Si `true`, el front no llama a API2 para whitelabel cuando api-ia falla (respuesta 503). Ver informe backend. |
| `API_IA_WHITELABEL_URL` | No*** | **Opción B (recomendada):** URL del endpoint de whitelabel en api-ia (ej. `https://api-ia.../webapi/config/whitelabel`). Si está definida, el front solo usa api-ia para whitelabel y no llama a API2. |

\* Solo si API2 tiene otra URL en tu entorno.  
\** Recomendado cuando api-ia implemente el endpoint de historial (diseño: front no usa API2).  
\*** Recomendado cuando api-ia implemente el endpoint de whitelabel (Opción B en docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md). Con historial + Opción B el front deja de llamar a API2 por completo.

---

## 2. Build y deploy

1. Desde la raíz del monorepo: `pnpm install` (y si pide actualizar lockfile: `pnpm install --no-frozen-lockfile`).
2. Build de la web: `pnpm --filter @bodasdehoy/web build` (o el comando que use tu pipeline para `apps/web`).
3. Desplegar el resultado de `apps/web` (.next o el artefacto que genere el build) al entorno de app-test (Vercel, Docker, etc.).
4. Configurar en el entorno las variables del apartado 1.

---

## 3. Comprobación rápida tras el deploy

1. Abrir app-test (ej. `https://app-test.bodasdehoy.com`).
2. Iniciar sesión con un usuario de prueba.
3. Abrir el panel del Copilot (botón/sidebar).
4. Enviar un mensaje: debe aparecer la respuesta (si api-ia está disponible) o un mensaje de error claro ("Servicio IA no disponible...").
5. Cerrar y reabrir el panel: si API2 tiene datos para tu sesión, debe cargarse el historial.

---

## 4. Si algo falla

- **"Servicio IA no disponible"**: comprobar `PYTHON_BACKEND_URL`, que api-ia esté en marcha y que acepte requests desde el origen de app-test (CORS, firewall).
- **Historial vacío**: comprobar que api-ia esté guardando en API2 (`event: done`) y que la app pueda llamar a API2 (o a `API2_GRAPHQL_URL`) con el JWT del usuario. Ver `docs/PLAN-COPILOT-MONOREPO.md` → sección 10 (Resolución de problemas).

---

## 5. Referencias

- Plan general: **docs/PLAN-COPILOT-MONOREPO.md** (sección 9. Despliegue).
- Integración monorepo: **docs/MONOREPO-INTEGRACION-COPILOT.md**.
