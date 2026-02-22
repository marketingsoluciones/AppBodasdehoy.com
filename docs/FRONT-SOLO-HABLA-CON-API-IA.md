# Front solo habla con api-ia — No hablamos con API2

**Canal único:** #copilot-api-ia  
**Interlocutor único desde nuestro lado:** equipo api-ia.

**Detalle completo (repos, APIs, qué componente afecta, listado de llamadas directas a API2):** **docs/REPOS-APIS-INTERLOCUTORES-Y-PENDIENTES.md**.

---

## Quién habla con quién

| Nosotros (Front) | Hablamos con | No hablamos con |
|------------------|--------------|------------------|
| **Sí** | **api-ia** (por #copilot-api-ia) | **API2** (no tenemos canal, contacto ni repo con ellos) |
| | | Otros backends/equipos (whitelabel, cola, etc.) |

Todo lo que necesitamos de API2 (payment_url en 402, catálogo de planes, credenciales whitelabel, wallet, etc.) **se lo pedimos a api-ia**. api-ia es quien coordina con API2 o con el componente que corresponda. **Sí hay llamadas directas** desde nuestro código a api2.eventosorganizador.com (Copilot y web), pero **no tenemos canal** con el equipo API2; por eso cualquier reclamación o petición va a api-ia.

---

## A qué componente/repo corresponde cada pendiente

Cuando reclamamos o pedimos algo en #copilot-api-ia, **no podemos dirigirnos a API2**. Indicamos qué necesitamos y **api-ia decide** si lo resuelve en su repo, lo pide a API2 o a otro equipo.

Resumen para que api-ia sepa a quién escalar:

| Lo que pedimos / el problema | Suele corresponder a |
|------------------------------|------------------------|
| Fix provider/modelo (anthropic + deepseek-chat), credenciales whitelabel bodasdehoy | api-ia y/o API2 (config whitelabel, keys) |
| stream=true → NO_PROVIDERS_AVAILABLE | api-ia (lógica de proveedores en streaming) |
| Contexto de usuario/evento en chat (JWT, evento activo) | api-ia (inyección de contexto) y/o API2 (datos usuario/evento) |
| payment_url / upgrade_url en 402 | API2 (api-ia nos avisa cuando esté) |
| GET /webapi/models/anthropic vacío, worker improve_text | api-ia (registro modelos, Celery/workers) |
| Cola de campañas operativa | api-ia + API2 (api-ia nos avisa cuando podamos re-probar) |
| getAvailablePlans, cambiar plan, wallet_credit, multinivel, etc. | API2 (api-ia puede trasladar la petición) |

Nosotros **solo** hablamos con api-ia. Cualquier coordinación con API2 o con otros repos es responsabilidad de api-ia.

---

## Resumen una línea

**Front (Bodas de Hoy) solo se comunica con api-ia por #copilot-api-ia. Todo lo que requiera de API2 o de otros componentes lo pedimos a api-ia; no tenemos forma de hablar con API2.**
