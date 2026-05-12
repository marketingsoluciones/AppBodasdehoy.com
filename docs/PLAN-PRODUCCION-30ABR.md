# Plan hacia produccion — 30 abril 2026

## FRONTEND (nosotros) — No depende de nadie

| # | Tarea | Estado | Archivo |
|---|-------|--------|---------|
| F1 | Fix logout silencioso (axios sin interceptor 401) | HECHO | hooks/useNotification.ts |
| F2 | Fix focused envia evento_id (no path) | HECHO | hooks/useNotification.ts |
| F3 | Limpiar queries muertas en Fetching.ts (getNotifications, updateNotifications legacy) | Pendiente | utils/Fetching.ts |
| F4 | Verificar compilacion de todas las apps | Pendiente | — |
| F5 | Deploy a Vercel rama test | Pendiente (tras F3+F4) | — |
| F6 | Deploy Socket.IO a produccion (NEXT_PUBLIC_SOCKET_URL en Vercel prod) | Pendiente (coordinar con api-ia) | — |

## BACKEND (ellos) — Bloqueante para nosotros

| # | Tarea | Estado | Cuando listo, nosotros hacemos |
|---|-------|--------|-------------------------------|
| B1 | createNotifications devuelve total:0 — revisar logs pm2 | Esperando | Reprobar E2E, confirmar en Slack |
| B2 | Confirmar aliases legacy (addCompartition, etc) funcionan | Confirmado verbalmente, falta probar | Migrar si no funcionan, o dejar como estan |
| B3 | Orientacion mutations faltantes (updateCustomer, updateActivityLink, getEventTicket) | Esperando | Adaptar frontend o deprecar funcionalidad |
| B4 | VAPID key Firebase | Esperando Direccion | Activar FCM push |
| B5 | Stripe test key | Esperando Direccion | Probar facturacion |

## COWORK — Puede avanzar independiente

```
Tareas que cowork puede hacer sin esperar a frontend:

1. Pedir logs de createNotifications al backend (B1):
   Escribir en #bodasdehoy-backend-coordinacion:
   "pm2 logs api-production | grep createNotifications —
    frontend sigue recibiendo total:0 con evento_ids reales"

2. Probar aliases legacy en Playground (B2):
   URL: https://api3-mcp-graphql.eventosorganizador.com/graphql
   - addCompartition con formato legacy
   - updateCompartition
   - deleteCompartition
   Reportar si devuelven success:true o error

3. Verificar pm2 status de api-production:
   ssh root@143.198.62.113 "pm2 status"
   Si caido → pedir restart al backend

4. Preguntar al backend sobre B3 (mutations faltantes):
   - updateCustomer: para que caso de uso sirve?
   - updateActivityLink: se depreco?
   - getEventTicket: que es un EventTicket?

5. Cuando B1 se resuelva (total:1):
   Avisar a frontend para deploy a test
```

## Orden de ejecucion

```
AHORA (frontend, sin depender de nadie):
  F3 → F4 → commit

CUANDO BACKEND CONFIRME B1 (createNotifications persiste):
  Reprobar E2E → F5 (deploy test)

CUANDO TODO OK EN TEST:
  F6 (deploy prod socket) → coordinar go-live con api-ia

EN PARALELO (cowork):
  Testear B1, B2, preguntar B3
```
