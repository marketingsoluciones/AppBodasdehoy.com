# PLAN DE SESIONES QA — BODAS DE HOY + MULTIDEVELOPER
Generado: 16 abril 2026
REGLA ANTI-CUELGUE: cada sesión lee SOLO su sección. NO pegar el doc completo.

## PIPELINE DE ENTORNOS
```
app-dev.bodasdehoy.com  →  chat-dev.bodasdehoy.com
         ↓                           ↓
app-test.bodasdehoy.com →  chat-test.bodasdehoy.com
         ↓                           ↓
    PRODUCCIÓN              PRODUCCIÓN
         ↓                           ↓
app-test.eventosorganizador.com → chat-dev.eventosorganizador.com
```

## CREDENCIALES
```
owner    → jcc@bodasdehoy.com / lorca2012M*+
coorg    → jcc@bodasdehoy.com / lorca2012M*+
invitado → jcc@marketingsoluciones.com / lorca2012M*+
extra    → jcc@recargaexpres.com / lorca2012M*+
```
Evento: "Boda Isabel & Raúl" — Mayo 20, 2080
Fixtures: `e2e-app/fixtures/champagne-events/eventos-sanitizados.json`
Validador: `bash validate-no-real-data.sh` (ejecutar ANTES de tests)

---

## SESIÓN 1 — BUGS CRÍTICOS APP-DEV (~15 min)
**Scope**: 3 bugs bloqueantes
- BUG-010: Invitaciones crashea `TypeError: null._id` en invitaciones.tsx:152
- BUG-014: Sesión cae a anonymous tras múltiples queries al Copilot
- BUG-R5E-02: Chat inaccesible sin seleccionar evento primero
**Cómo**:
```bash
npx playwright test e2e-app/invitaciones.spec.ts
npx playwright test e2e-app/copilot-chat.spec.ts
```
**Output**: PASS/FAIL + screenshot + error si falla

---

## SESIÓN 2 — BUGS CRÍTICOS CHAT-DEV (~20 min)
**Scope**: 4 bugs severity 🔴 en chat-dev.bodasdehoy.com (login: owner)
1. Confusión tarea/evento → "crear tarea probar sonido" → NO debe crear evento
2. Selección evento → "datos de Boda Isabel y Raúl" → evento correcto
3. Datos falsos → "cuántos invitados pendientes" → verificar 3 pendientes
4. Promesas falsas → "anota alergia gluten" → debe decir "no puedo"
**Output**: tabla bug/resultado/evidencia

---

## SESIÓN 3 — BUGS PENDIENTES APP-DEV (~15 min)
- BUG-011: Emails con "en el desarrollo undefined"
- BUG-013: Co-org sin evento compartido
- BUG-015: Copilot mantiene contexto sin permitir cambiar
- BUG-016: Sugerencias vuelven a inicio
- BUG-R5E-01: Checkboxes no estándar
**Output**: CORREGIDO / PERSISTE / NO REPRODUCIBLE

---

## SESIÓN 4 — BUGS 🟡 CHAT-DEV (~15 min)
5. "Demasiados pasos" → acción multi-paso
6. Eventos ocultos visibles
7. Fecha 2080 por defecto
8. Sin filtro de dominio → preguntar "receta de sangría"
9. Timeline inventado
**Output**: tabla bug/resultado

---

## SESIÓN 5 — UX CHAT-DEV (~10 min)
- Markdown ### no renderiza
- Sidebar OBCRM visible
- Textos en inglés
- /files error 500
- Saldo negativo €-0.27
**Output**: lista con screenshots

---

## SESIÓN 6 — NUEVOS TESTS PLAYWRIGHT R5F (~20 min)
1. Seleccionar evento antes de navegar módulos
2. Chat real (mensajes con invitados)
3. Checkboxes tareas (UI no estándar)
4. Subida de archivos
5. Notificaciones reales vs falsos positivos

---

## SESIÓN 7 — SIMETRÍA COPILOT vs CHAT-IA (~15 min)
Misma pregunta a ambas apps:
1. "¿Cuántos invitados tiene la Boda Isabel y Raúl?"
2. "¿Cuál es el presupuesto total?"
3. "Lista los invitados pendientes"
4. "¿Qué servicios están contratados?"
5. "Crea una tarea: probar sonido iglesia"
**Output**: tabla comparativa

---

## SESIÓN 8 — MULTIDEVELOPER EVENTOSORGANIZADOR (~20 min)
- app-test.eventosorganizador.com → smoke + módulos
- chat-dev.eventosorganizador.com → bugs 1-4
**Datos**: fixtures champagne-events (mismos)
**Output**: tabla diferencias entre developers

---

## SESIÓN 9 — ONBOARDING COPILOT "PRIMERA BODA" (~20 min)
Flujo: usuario crea evento → Copilot guía paso a paso
1. Copilot sugiere: "¿Empezamos con el presupuesto?"
2. Pregunta rango → genera categorías (lugar, catering, foto, música, deco)
3. Sugiere crear grupos de invitados (familia novia/novio, amigos, trabajo)
4. Pregunta estimación → distribución por grupo
5. Cierra con: "¿Configuramos el itinerario del día?"
**Datos**: usar "boda de carlos" del fixture sanitizado
**Output**: spec nuevo + validación del flujo

---

## REGLAS ANTI-CUELGUE (COPIAR EN CADA SESIÓN)
```
1. NO pegues este doc completo. Lee SOLO tu sección con Read tool.
2. ANTES de tests: bash validate-no-real-data.sh
3. Fixture: e2e-app/fixtures/champagne-events/eventos-sanitizados.json
4. Si JSON >50 líneas, léelo con Read tool, NO lo pegues en el chat.
5. Máximo 1 test a la vez. Espera resultado antes del siguiente.
6. Si el contexto se llena, PARA y reporta lo que llevas.
7. Screenshots → .screenshots/, NO pegarlos en el chat.
8. Responde en español, directo, sin rodeos.
```

## RESUMEN
| # | Scope | Duración |
|---|-------|----------|
| 1 | Bugs críticos app-dev | ~15 min |
| 2 | Bugs críticos chat-dev | ~20 min |
| 3 | Bugs pendientes app-dev | ~15 min |
| 4 | Bugs 🟡 chat-dev | ~15 min |
| 5 | UX chat-dev | ~10 min |
| 6 | Nuevos tests Playwright | ~20 min |
| 7 | Simetría copilot vs chat | ~15 min |
| 8 | Multideveloper eventosorg | ~20 min |
| 9 | Onboarding "Primera Boda" | ~20 min |
| **TOTAL** | | **~2h 30min** |
