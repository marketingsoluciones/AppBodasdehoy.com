# Estado Copilot / api-ia – Resumen rápido

Última actualización: refleja el trabajo de integración con api-ia y eliminación de dependencia directa de API2 desde el front.

---

## Hecho (front listo)

| Área | Estado |
|------|--------|
| **Historial** | Si `API_IA_CHAT_HISTORY_URL` está definida → el front llama a api-ia (GET). Si no → fallback a API2 `getChatMessages`. Test con api-ia incluido. |
| **Whitelabel** | Si `API_IA_WHITELABEL_URL` está definida (Opción B) → el front solo llama a api-ia. Si no → API2 o `SKIP_WHITELABEL_VIA_API2=true` (503 sin API2). |
| **API2 en web** | `API2_GRAPHQL_URL` por env; api.js legacy con URL unificada (HTTPS). |
| **Tests** | chat-history (API2 + api-ia), chat (contrato), copilotChat, copilotMetrics. |
| **Docs** | INFORME-BACKEND, INFORME-API-IA-RESUMEN-NECESIDADES, DESPLIEGUE, LISTADO API2, PROBAR-SIN-NAVEGADOR, MONOREPO, PLAN. |

---

## Pendiente (cuando corresponda)

| Qué | Dónde / cómo |
|-----|----------------|
| **api-ia implemente** | Historial: `GET /webapi/chat/history`. Whitelabel: `GET /webapi/config/whitelabel`. Ver docs/INFORME-API-IA-RESUMEN-NECESIDADES.md. |
| **Verificación en local** | `pnpm install` (+ `--no-frozen-lockfile` si pide) → `pnpm test:web`. Sin navegador: docs/PROBAR-SIN-NAVEGADOR.md. |
| **Despliegue app-test** | Variables: `PYTHON_BACKEND_URL`, y cuando api-ia esté listo: `API_IA_CHAT_HISTORY_URL`, `API_IA_WHITELABEL_URL`. Checklist: docs/DESPLIEGUE-APP-TEST-COPILOT.md. |
| **Copilot/LobeChat** | Alcance (auth, billing, wallet) pendiente de respuesta backend; ver Fase 2 en docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md. |

---

## Referencias clave

- **Necesidades api-ia (compartir):** docs/INFORME-API-IA-RESUMEN-NECESIDADES.md  
- **Probar sin navegador:** docs/PROBAR-SIN-NAVEGADOR.md  
- **Plan completo:** docs/PLAN-COPILOT-MONOREPO.md  
