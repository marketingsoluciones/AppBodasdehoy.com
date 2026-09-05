DE: COORD-AppEventos
PARA: PRODUCTO / JCP
DRI: producto_oncall
CANAL: #coordinacion
HILO: 1778170638.897419
ASUNTO: ✋ ACK necesario — confirmaciones P11/P12/P13 + 2 decisiones activas


Producto NO está bloqueando ningún flujo activo del front.
Lo siguiente son 3 acks formales + 2 decisiones que llegan
cuando puedas para no dejar tickets fantasma.


═══════════════════════════════════════════════════════════
[1] ACK decisiones P11/P12/P13 (basta 👍 o "OK")
═══════════════════════════════════════════════════════════

Si te parecen bien tal cual quedaron en F11 (Slack ts 1780812003),
basta confirmar para que el equipo se alinee y se abran tickets:


  P11 MEMORIA PERSISTENTE
  ────────────────────────
  → SÍ — Q3 (jul-sep 2026)
  + Billing en 3 momentos: extract / recall / storage
  + Topes por plan (ver punto [2-a] abajo)
  + UI Settings>Memoria con ver/borrar/exportar (GDPR)
  + Ticket api-ia separado, no entra CAPA 3 actual


  P12 MARKETPLACE PLUGINS/MCPs
  ─────────────────────────────
  → HÍBRIDO
  + Catálogo LobeHub (lectura, gratis)
  + Filtro/curación administrada por nosotros
  + Whitelist por whitelabel (bodasdehoy = solo plugins boda)


  P13 apiapp.bodasdehoy.com
  ──────────────────────────
  → DEPRECADO
  + Front YA no apunta (commit hecho)
  + No mencionar como activo en mensajes futuros
  + Apagar droplet cuando estemos en prod estable (ver [2-b])


═══════════════════════════════════════════════════════════
[2] DECISIONES ACTIVAS QUE NECESITAN INPUT
═══════════════════════════════════════════════════════════

  (a) TOPES PLAN MEMORIA (P11)
      Propuesta inicial:
        FREE        →   0 memorias
        BASIC 9.99  →  50 memorias activas máx
        PRO   29.99 → 500 memorias activas máx
        MAX   79.99 → 5000 memorias activas máx
        ENTERPRISE → ilimitado

      ¿Validas estos números, o ajustamos?

      Coste real embeddings + storage por usuario activo aún no
      lo tengo cuantificado. Si quieres, hago un cálculo con
      api-ia antes de cerrarlo.


  (b) CUÁNDO APAGAR DROPLET apiapp.bodasdehoy.com
      Estado actual:
        - Front no apunta a apiapp (commit hecho)
        - Imágenes legacy via proxy media-apiapp (droplet
          DISTINTO, sigue vivo)
        - Droplet apiapp probablemente idle

      Opciones:
        (i)   Apagar cuando merge a `dev`
        (ii)  Esperar a que llegue a `test` (más conservador)
        (iii) Esperar a `master` / producción estable
        (iv)  Apagar YA (riesgo cero porque front no apunta)

      Recomendación COORD: (i) cuando merge a dev. Ahorro €/mes
      sin riesgo real.


═══════════════════════════════════════════════════════════
[3] FYI — ronda actual con backend (no requiere acción)
═══════════════════════════════════════════════════════════

api-ia avanzó 3 bloques (turn, galería, chunks+PDF) durante la
noche. Hay 4 bugs abiertos ya reportados con archivo:línea exacto.

Bug crítico abierto: /chat/structured 200 OK pero NO factura
(no descuenta wallet). Bloquea merge Fase 3b a dev. Reportado
con fix exacto. Estimado 20 min api-ia.

Mi avance commits:
  ec9145b7 aiChat.generateJSON → /chat/structured
  8792572e aiModel toggle+order → userConfig (Bloque B)

ETAs api-ia esta semana:
  - Fixes los 4 bugs (~40 min código + restart)
  - Deploy bloque 2 turn
  - Bloques 4+5 funcionando OK

ETAs api-ia próxima semana:
  - Bloque 6 apikeys CRUD
  - Bloque 7 export/import GDPR


═══════════════════════════════════════════════════════════
NO HAY URGENCIA
═══════════════════════════════════════════════════════════

  Nada de lo anterior bloquea el día a día del usuario en prod.
  Solo necesito tu ack para mover tickets adelante con orden.

  Si me dices "OK todo" cierro circuitos y reporto al equipo.
  Si quieres ajustar algo, dime qué.


DRI: coord_appeventos — solo cuando tengas un minuto.
