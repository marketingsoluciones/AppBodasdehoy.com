# Siguiente sesion cowork — desde 30 abr 2026

## Estado actual

### Resuelto hoy
- Scripts Slack corregidos: `slack-send.sh` y `slack-read.sh` ahora van a #bodasdehoy-backend-coordinacion por defecto
- Disculpa enviada al canal correcto por la confusion de canales
- createNotifications: schema OK pero commit 11c0274 NO desplegado en servidor (reportado)
- Mapeo legacy → api3-mcp completo y enviado para confirmacion
- getNotifications/updateNotifications: ya migrados en /api/notifications (codigo muerto en Fetching.ts)

### Esperando del backend
1. **Deploy commit 11c0274** — createNotifications (schema pasa, resolver no persiste)
2. **Confirmacion del mapeo** de mutations (compartir eventos, permisos)
3. **Orientacion** sobre 5 operaciones sin equivalente (updateCustomer, updateActivityLink, getEventTicket, createComment con adjuntos, addTaskAttachments)

## Siguiente paso cuando vuelvas

### 1. Revisar Slack primero
```bash
# Canal de coordinacion (default)
bash scripts/slack-read.sh 10

# Canal api-ia (si necesitas)
bash scripts/slack-read.sh --from api-ia 5
```

### 2. Si el backend confirmo el deploy de createNotifications
```bash
# Probar E2E
TOKEN=$(curl -sS -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM" -H 'Content-Type: application/json' -d '{"email":"bodasdehoy.com@gmail.com","password":"lorca2012M*+","returnSecureToken":true}' | python3 -c "import sys,json; print(json.load(sys.stdin)['idToken'])")

curl -sS -X POST 'https://api3-mcp-graphql.eventosorganizador.com/graphql' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer '"$TOKEN" \
  -H 'Development: bodasdehoy' \
  -d '{"query":"mutation ($args:inputNotifications){ createNotifications(args:$args){ total results{ _id } } }","variables":{"args":{"type":"user","message":"test post-deploy","uids":["OMkxtxExEgZHvVJVW249uZHq5eR2"],"fromUid":"upSETrmXc7ZnsIhrjDjbHd7u2up1","focused":"/test"}}}'
```
Si devuelve `total: 1` → reportar exito en Slack. Si `total: 0` → reportar que sigue sin persistir.

### 3. Si confirmaron el mapeo de compartir
Migrar en este orden:
1. `addCompartitions` → `compartirEvento` (AddUserToEvent.tsx)
2. `deleteCompartitions` → `revocarAccesoEvento` (ListUserToEvent.js)
3. `updateCompartitions` → `updateCRMEntityPermission` (ModalPermissionList.tsx)

### 4. Para enviar mensajes Slack
```bash
# Al canal de coordinacion (default)
bash scripts/slack-send.sh --web "tu mensaje"

# A api-ia especificamente
bash scripts/slack-send.sh --web --to api-ia "tu mensaje"
```

## Archivos de referencia
- `docs/PENDIENTES-BACKEND-29ABR.md` — estado de pendientes
- `docs/MAPEO-LEGACY-MCP.md` — mapeo de mutations
- `apps/appEventos/pages/api/notifications.ts` — proxy ya migrado a firma nueva
- `apps/appEventos/hooks/useNotification.ts` — usa createNotifications
- `apps/appEventos/utils/Fetching.ts` — queries legacy (algunas son codigo muerto)

## Reglas importantes
- Slack: SIEMPRE escribir a #bodasdehoy-backend-coordinacion (default)
- SSH api-mcp: SOLO LECTURA
- Bot token es apiia_bot (pendiente pedir uno propio a Direccion)
- Dev server appEventos: puerto 3220
