# Avances y respuestas de api-ia (Slack #copilot-api-ia)

**Última lectura del canal:** 17 feb 2026 (`./scripts/slack-read.sh 25`)

---

## 1. Mensajería (informe plataformas + coordinación)

**Respuesta de api-ia (más reciente):**

> **[api-ia] Colaboración – revisión de mensajería hecha**  
> Hemos revisado los canales (revisión 15:54). Por nuestra parte: seguimos con sync cola en servidor y baterías B1–B10. Disponibles para coordinación y revisión de mensajes cuando haga falta.

**Qué implica:**
- Han hecho una **revisión de los canales** de mensajería (en el contexto del informe/coordinación que les pasamos).
- Siguen trabajando en **sync de cola en servidor** y **baterías B1–B10**.
- Se declaran **disponibles para coordinación y revisión de mensajes** cuando haga falta.

**Nuestros envíos que aparecen en el hilo:**
- Mensaje de “tres cosas” (análisis, os lo hemos pasado, quién coordina) + referencia a `docs/INFORME-PLATAFORMAS-OPEN-SOURCE-MENSAJERIA-PARA-API-IA.md` y docs de estado/contrato.
- Envío previo del informe (objetivo: que completen e investiguen).
- Mensaje de coordinación mensajería (ESTADO-WHATSAPP, AUDITORIA-FRONT, contrato GraphQL/REST).

**Pendiente:** Que api-ia comparta decisiones o acuerdos de interfaz (repos, qué exponer al front) cuando los tengan; mientras tanto siguen con cola y baterías.

---

## 2. Cola de campañas (api-ia ↔ API2)

**Mensajes de api-ia:**
- Están **cerrando la integración con API2** (spec de la cola).
- Cuando tengan la conexión operativa, **avisarán por #copilot-api-ia** para que podamos volver a probar el flujo (p. ej. campaña “prueba de correo 2”).
- Duda de coordinación: #api-ia-api2-sync o #copilot-api-ia.

**Para CRM-Front (api-ia pide):**
1. **EventSelector:** usar la query `getEventosByUsuario` (no `queryenEvento`), según indicación de API2.
2. Re-probar campañas cuando api-ia avise de que la cola está conectada.

---

## 3. Pendientes Frontend (recordatorios api-ia) – estado nuestro

**Lo que api-ia pedía y nuestro estado (ya confirmado por nosotros en Slack):**

| Punto api-ia | Estado Frontend |
|--------------|-----------------|
| UI saldo agotado (402) | ✅ Implementado (proxy 402 + payment_url/billing_url, mensaje “Saldo agotado” + link) |
| 401 sesión expirada | ✅ Implementado (detección 401 y redirección a login) |
| Ejemplos 503 con trace_id | Si volvemos a ver alguno, lo enviamos por el canal |
| Re-probar cuando avisen | ✅ Listos; avisan y probamos |

**Pendiente de api-ia / API2:**
- **payment_url en 402:** cuando API2 lo exponga, nos avisan para usar en proxy/UI.
- **Items 8 y 9:** endpoint/formato para balance de keys en UI y notificaciones (cuando lo tengan).
- **Feedback thumb up/down:** si acordamos formato/endpoint, lo implementamos.

**Pendiente nuestro (según api-ia):**
- **Cloudflare (app-test, chat-test):** configuración de Public Hostnames (Zero Trust) es responsabilidad Frontend cuando podamos.

---

## 4. Cómo actualizar este doc

- Volver a leer el canal: `./scripts/slack-read.sh 25` (o 50).
- Copiar aquí las nuevas respuestas de api-ia y actualizar la fecha “Última lectura del canal”.
- Mantener la tabla de “Pendientes” alineada con lo que digan en #copilot-api-ia.
