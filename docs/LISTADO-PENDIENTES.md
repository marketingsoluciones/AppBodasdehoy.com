# Listado de pendientes (Frontend – api-ia)

## Pendientes nuestros
1. ~~**Plan testing coordinado**~~ ✅ Respondido en Slack 17-feb. api-ia confirmó recibido.
2. ~~**Implementar 402 (saldo agotado)**~~ ✅ Implementado en proxy (chat.ts) y cliente (copilotChat.ts). Notificado a api-ia.
3. ~~Cloudflare app-test/chat-test (CNAME + Public Hostnames)~~ ✅ Ya configurado: DNS apunta a Cloudflare, tunnel `lobe-chat-harbor` activo con ambas rutas.
4. Sistema monitoreo API Keys – enviar doc si api-ia pide más
5. Balance keys en UI – responder en #copilot-api-ia
6. Notificaciones keys – elegir y responder
7. Pruebas usuario real (opcional)
8. UI saldo agotado con enlace a Facturación – cuando api-ia exponga payment_url en 402

## Pruebas autónomas (sin aceptación)
./scripts/slack-read.sh 8
./scripts/test-api-ia-y-enviar-slack.sh
node scripts/run-20-preguntas-api-ia.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-b.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-c.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-d.mjs --json
./scripts/slack-send.sh "mensaje"

Referencias: docs/PENDIENTES-Y-SLACK-ESTADO.md | docs/PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md | docs/PROMPT-AGENTE-PARALELO-API-IA.md (prompt para otro agente Cursor que coordine con api-ia sin esperar aceptación).
