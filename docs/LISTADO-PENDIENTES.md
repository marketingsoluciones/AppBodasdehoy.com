# Listado de pendientes (Frontend – api-ia)

## Pendientes nuestros
1. ~~**Plan testing coordinado**~~ ✅ Respondido en Slack 17-feb. api-ia confirmó recibido.
2. ~~**Implementar 402 (saldo agotado)**~~ ✅ Implementado en proxy (chat.ts) y cliente (copilotChat.ts). Notificado a api-ia.
3. ~~Cloudflare app-test/chat-test (CNAME + Public Hostnames)~~ ✅ Ya configurado: DNS apunta a Cloudflare, tunnel `lobe-chat-harbor` activo con ambas rutas.
4. ~~**user_message en 503**~~ ✅ Implementado (commit af64ecee, 18-feb): proxy + cliente priorizan user_message de api-ia sobre error técnico (streaming + no-streaming).
5. ~~**429 rate limit**~~ ✅ Implementado (commit 38973849, 18-feb): proxy devuelve 429 con Retry-After; cliente muestra mensaje con tiempo de espera.
6. ~~**Fix tsconfig test**~~ ✅ Excluidos __tests__/*.test.ts del tsconfig Next.js (commit 5526aba0).
7. Sistema monitoreo API Keys – enviar doc si api-ia pide más
8. Balance keys en UI – esperando endpoint de api-ia
9. Notificaciones keys – esperando decisión de api-ia
10. ~~**Botón "Reintentar" en 503**~~ ✅ Implementado (commits a78a66c9 + 1ebba2d3 + 5f388fc7, 18-feb): banner aparece en 503/429/red; `__isStreamingHttpError` flag corrige bug donde streaming 503 nunca activaba retry.
10b. ~~**Filtro AUTH_ERROR en Reintentar**~~ ✅ Implementado (18-feb tarde): no mostrar Reintentar si `X-Backend-Error-Code: AUTH_ERROR`; se propaga `__errorCode` en el error lanzado.
11. Pruebas usuario real (opcional)
12. UI saldo agotado con enlace a Facturación – proxy ya devuelve billing_url; api-ia avisará cuando API2 exponga payment_url/upgrade_url

## Respuesta api-ia (18-feb tarde)
- user_message en 503: confirmado ✅ disponible en todos los errores
- Reintentar recomendado para: UPSTREAM_RATE_LIMIT, EMPTY_RESPONSE, PROVIDER_ERROR, TIMEOUT_ERROR. NO para AUTH_ERROR → implementado ✅
- Feedback (thumb up/down): disponible si definimos endpoint/formato — pendiente decisión
- 402 + payment_url: esperan a que API2 lo exponga, nos avisarán

## Resultados baterías 18-feb
| Batería | OK | Fallos | Notas |
|---------|-----|--------|-------|
| A (20q) | 20/20 | 0 | Todas coherentes ✅ (×2 hoy: mañana + tarde) |
| B (20q) | 19/20 | 1 | [20] Catering financiero → 503 orchestrator |
| C (20q) | 13/20 | 7 | Rate limit upstream (5×), provider 400 (1×), orchestrator vacío (1×) |
| D (20q) | 17/20 | 3 | Auth error (1×), provider 400 (1×), rate limit (1×) |
| E (20q) | 20/20 | 0 | Todas coherentes ✅ (secuencial, misma tarde) |

C+D corrieron en paralelo → más rate limiting que si se corren secuencialmente.

## Pruebas autónomas (sin aceptación)
./scripts/slack-read.sh 8
./scripts/test-api-ia-y-enviar-slack.sh
node scripts/run-20-preguntas-api-ia.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-b.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-c.mjs --json
node scripts/run-20-preguntas-api-ia-bateria-d.mjs --json
./scripts/slack-send.sh "mensaje"

Referencias: docs/PENDIENTES-Y-SLACK-ESTADO.md | docs/PENDIENTES-Y-POR-QUE-VPN-NO-CARGA.md | docs/PROMPT-AGENTE-PARALELO-API-IA.md (prompt para otro agente Cursor que coordine con api-ia sin esperar aceptación).
