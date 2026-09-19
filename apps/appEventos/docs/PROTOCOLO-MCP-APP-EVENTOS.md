# Protocolo API2 ↔ App eventos (GraphQL, Socket, suscripción, invitados)

**Versión:** 2026-04-18 — consolida contexto front + respuestas API2 y define cómo coordinar mejoras.

---

## 1. Arquitectura acordada (tres vías)

| Vía | Variable típica | Rol |
|-----|------------------|-----|
| **API app** | `NEXT_PUBLIC_BASE_URL` | POST `/graphql`: eventos, invitados. Mutación principal en este repo: **`creaInvitado`** (API2 a veces cita `agregarInvitado` como nombre equivalente en otro despliegue; no es el mismo identificador GraphQL del código aquí). |
| **API2** | `NEXT_PUBLIC_API2_URL` | Planes, `getSubscriptionPlans`, `getMySubscription`. |
| **Socket.IO** | `NEXT_PUBLIC_BASE_API_BODAS` (normalizado) | Tiempo real: salas por `event_id`, sincronización entre sesiones. **No** sustituye listados GraphQL; si falla → refrescar / re-fetch. |

**Nota API2:** el host donde responde el **GraphQL de API2** **no expone** `/socket.io/`. 404 o `ERR_NAME_NOT_RESOLVED` → otro servicio, proxy/DNS o path oficial de realtime en **infra**.

---

## 2. Conclusiones de la respuesta coordinada

1. **Latencia eventos:** no hay SLA/p95 fijado en código; Mongo con índice en `compartido_array`. Timeouts largos se depuran con **trazas** y datos del §3.
2. **Socket:** desacoplado del GraphQL API2 en ese host; coordinación **infra + URL oficial** del realtime.
3. **`SubscriptionStatus`:** enum en MAYÚSCULAS; BD en minúsculas → field resolver API2 mapea BD → enum. Tras **deploy verificado**, el front puede **volver a pedir `status` y `trial_end`** en `getMySubscription`.
4. **Multi-marca:** contrato estable `Development` (API app) vs `X-Development` (API2); API2 ya lee `X-Development` con fallback.
5. **Cuota invitados:** paridad servidor/UI (`guests-per-event`, `errors[].code`) es **backlog**; hoy el guardado no aplica la misma regla que la UI de API2.

---

## 3. Protocolo de escalado (datos mínimos)

- Entorno, timestamp, `event_id`, uid de **prueba**, captura/HAR (sin JWT).
- Solo nombres: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API2_URL`, `NEXT_PUBLIC_BASE_API_BODAS`.
- Enlazar **ticket o ventana de deploy** al cerrar o al abrir fix.

---

## 4. Checklists

### Tras deploy resolver `UserSubscription.status`
- [ ] Probar `getMySubscription` con `status`/`trial_end` sin error de enum.
- [ ] Restaurar campos en `hooks/usePlanLimits.ts` y desplegar app eventos.
- [ ] Enlace al ticket/deploy en el hilo.

### Socket / realtime
- [ ] Infra: host + path oficial y rewrites si aplica.
- [ ] (Mejora) Variable dedicada `NEXT_PUBLIC_SOCKET_URL` si el realtime no comparte base con `NEXT_PUBLIC_BASE_API_BODAS` — requiere acuerdo.

### Cuota invitados (backlog)
- [ ] Acordar códigos con `planLimitsCoordination.ts`.
- [ ] ETA/ticket en hilo cuando exista.

---

## 5. Mejoras de protocolo sugeridas

1. Glosario **`creaInvitado` (este repo)** vs **`agregarInvitado` (cita API2)** en mensajes cruzados.
2. Un hilo por incidente con cierre enlazado a deploy.
3. Changelog o aviso previo en **cambios de esquema** que rompan clientes.

---

## 6. Referencias

- `RESPUESTA-API2-GRAPHQL-SOCKET-SUSCRIPCION.md`
- `utils/planLimitsCoordination.ts`, `utils/planLimitFromApiError.ts`
- `api.js` (`resolveSocketBaseUrl`)
