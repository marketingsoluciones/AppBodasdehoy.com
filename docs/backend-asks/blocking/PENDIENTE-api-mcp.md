DE: COORD-AppEventos
PARA: API-MCP
DRI: api_mcp_oncall
CANAL: #coordinacion
HILO: 1778170638.897419
ASUNTO: 📋 Pendiente sin urgencia — 2 gaps de schema (NO bloquean)


api-mcp NO está bloqueando ningún flujo activo del front.
Lo siguiente son 2 gaps menores que dejarían el tipado parcial
en TS sin afectar funcionalidad. Necesitan decisión vuestra:
hacerlo o cerrarlo como "no se hace".


═══════════════════════════════════════════════════════════
[P9] getUsersByIds — tipo User incompleto
═══════════════════════════════════════════════════════════

Smoke real Cat C 11/11 verde, gracias por eso.

Pero el tipo User devuelto NO incluye 4 campos que el front
necesitaría:
  • displayName
  • photoURL
  • phoneNumber
  • onLine

Front hace aliases GraphQL temporales:
```graphql
getUsers: `query ($ids:[ID!]!, $development:String!){
  getUsers: getUsersByIds(ids:$ids, development:$development){
    uid: id
    email
    displayName: email     ← fallback temporal
  }
}`
```

Decisión necesaria, cualquiera de las 2 me sirve:

  (a) AÑADIR los 4 campos al schema → quito el alias y pido
      directamente.

  (b) CONFIRMAR displayName=email como canónico permanente →
      quito el alias también pero usando email directo.

Si elegís (a), mantengo el alias hasta el deploy y luego paso
a los campos directos.


═══════════════════════════════════════════════════════════
[P10] getAllBusinesses — types Unknown
═══════════════════════════════════════════════════════════

En el schema GraphQL público quedan dos parámetros como Unknown:
  • searchCriteriaBusiness
  • sortCriteriaBusiness

Front pasa `any` en builder por ahora (TS no se queja pero pierde
type-safety). Funciona, solo es deuda de tipado.

Decisión necesaria:

  (a) TIPAR los 2 cuando podáis (no urge ETA exacta, solo saber
      si está en el roadmap).

  (b) CERRAR como "se tipa cuando se revise el módulo Business"
      (post-refactor planeado).


═══════════════════════════════════════════════════════════
NO HAY URGENCIA
═══════════════════════════════════════════════════════════

Ninguno de los dos bloquea Fase 3b, CAPA 3, ni el flujo actual
de eventos/invitados/presupuesto/itinerario.

Solo necesito saber qué hacer con ellos para no dejar tickets
fantasma en el backlog.


═══════════════════════════════════════════════════════════
RECORDATORIO POLÍTICA UNIVERSAL (FYI, no aplica aquí)
═══════════════════════════════════════════════════════════

Producto reafirmó: cualquier endpoint futuro que api-mcp añada
y consuma recursos IA (LLM tokens, embeddings, etc.) debe
integrar billing con api-ia (track_ai_usage existente).

Para getUsersByIds/getAllBusinesses NO aplica (queries informativas
sin coste IA). Solo recordatorio para nuevos endpoints LLM.


DRI: coord_appeventos — sin presión. Respondedme cuando podáis.
