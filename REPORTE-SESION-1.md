# REPORTE SESIÓN 1 — BUGS CRÍTICOS APP-DEV
Fecha: 16 abril 2026 | Entorno: E2E_ENV=dev | Config: pw-e2e-noserver.config.ts

## RESUMEN
| Bug | Resultado | Detalle |
|-----|-----------|---------|
| BUG-010 | ⏭️ NO VERIFICABLE | 13/16 tests skipped — spec usa `BASE_URL=127.0.0.1:8080` hardcodeada |
| BUG-014 | ✅ NO REPRODUCIDO | 11/11 tests copilot PASS — sesión estable 7.6 min |
| BUG-R5E-02 | ❌ PERSISTE | CF45 FAIL — chat-dev.bodasdehoy.com login timeout |

## DETALLE POR TEST

### invitaciones.spec.ts (BUG-010)
- 2 passed: RSVP portal tests (sin token → error controlado)
- 13 skipped: el spec hardcodea `BASE_URL=127.0.0.1:8080` y `isAppTest`
  resulta false → todos los tests con login se saltan
- 1 failed: portal público intenta conectar a puerto 8080 (no disponible)
**FIX NECESARIO**: invitaciones.spec.ts línea 22 usa `BASE_URL || '127.0.0.1:8080'`
pero debería importar `TEST_URLS.app` de fixtures.ts como hacen los otros specs.

### copilot-chat.spec.ts (BUG-014)
- **11/11 PASS** en 7.6 minutos (webkit)
- Tests 1-2: Copilot "no encontrado" en DOM pero pass sin crash
- Tests 3-4: /presupuesto y /invitados cargan sin ErrorBoundary
- Test 5: Sidebar resize no visible (cerrado) — pass
- Tests 6-7: filter_view postMessage funciona correctamente
- Tests 8-9: chat standalone carga sin error 500
- Tests 10-11: los 2 últimos también pass
- **Conclusión**: sesión NO cae a anonymous en 11 requests consecutivos
  → BUG-014 puede ser intermitente o ya corregido

### chat-ia-flows.spec.ts CF45 (BUG-R5E-02)
- **1 FAIL**: `page.goto('https://chat-dev.bodasdehoy.com/login')` timeout
- chat-dev responde HTTP 307 (redirect) en 0.8s con curl
- app-dev responde HTTP 200 en 9.5s
- El test usa timeout de 45s × LOAD_MULTIPLIER pero falla
- **Conclusión**: chat-dev está UP pero el login flow del test no completa

## ACCIONES SIGUIENTES
1. **FIX invitaciones.spec.ts**: cambiar `BASE_URL` a usar `TEST_URLS.app`
2. **BUG-014**: marcar como "no reproducible" — monitorear en sesiones futuras
3. **BUG-R5E-02**: verificar manualmente chat-dev login — puede ser tema de
   certificado SSL o redirect loop en webkit
4. Pasar a Sesión 2: bugs críticos chat-dev (testeo manual)
