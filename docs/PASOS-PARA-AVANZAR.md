# Pasos para avanzar

Checklist para cuando **app-test** o **chat-test** no cargan, o cuando necesitas **evidencia** para api-ia.

---

## Estado actual (última comprobación)

| Qué | Estado | Nota |
|-----|--------|------|
| **app-test** | ❌ 502 | Servidor/origin no responde |
| **chat-test** | ❌ 502 | Servidor/origin no responde (si fuera 500 = proceso arriba pero error al renderizar) |
| **api-ia** | ✅ OK | Queries reales responden 200 |
| **api2** | ✅ OK | getSubscriptionPlans 200 |

Para comprobar de nuevo: `node scripts/ejecutar-pruebas-reales-todas.mjs`

---

## 1. Si app-test no carga (502)

**Quién:** Nosotros. app-test y chat-test son reverse proxy: solo hay que apuntar cada uno al puerto adecuado en Cloudflare y que el proceso esté escuchando en ese puerto.

**Mensaje listo para enviar:** Ver `scripts/mensaje-502-para-infra.txt` (copia/pega para Slack o email).

1. Confirmar que el **proceso** que sirve app-test está **arrancado** (reiniciar si hace falta).
2. Comprobar que **Cloudflare** tiene el **Origin** correcto para app-test.bodasdehoy.com.
3. Revisar **logs** del servidor por crash o error de arranque.
4. Si hubo cambios de código, **volver a desplegar** en el entorno de app-test.

Detalle: [docs/SOLUCIONES-CHAT-APP-TEST-API-IA.md](SOLUCIONES-CHAT-APP-TEST-API-IA.md) → sección "app-test no carga".

---

## 2. Si chat-test no carga (502 o 500)

- **502:** El servidor/origin donde está chat-test no responde. Mismos pasos que app-test: arrancar/reiniciar proceso y revisar Cloudflare.
- **500:** El servidor sí responde pero falla al generar la página. Revisar **logs** del servidor (stack trace) y **variables de entorno**; reproducir en local si hace falta.

Detalle: [docs/SOLUCIONES-CHAT-APP-TEST-API-IA.md](SOLUCIONES-CHAT-APP-TEST-API-IA.md) → sección "chat-test no carga".

---

## 3. Si necesitas evidencia para api-ia (503 u otro fallo)

1. Ejecutar: `node scripts/ejecutar-pruebas-reales-todas.mjs`
2. En `test-results/` se generan `pruebas-reales-completo-*.json` y `*.md`.
3. Enviar a api-ia el **.md** (resumen) y el **.json** (o el fragmento del request/response que falle).

Detalle: [docs/PRUEBAS-REALES-API-IA-API2.md](PRUEBAS-REALES-API-IA-API2.md).

---

## 4. Cómo dejar funcionando app-test y chat-test

Guía paso a paso para quien tenga acceso al servidor o al despliegue:

**[COMO-DEJAR-FUNCIONANDO-APP-TEST-CHAT-TEST.md](COMO-DEJAR-FUNCIONANDO-APP-TEST-CHAT-TEST.md)**

---

## 5. Documentos de referencia

| Doc | Para qué |
|-----|----------|
| [COMO-DEJAR-FUNCIONANDO-APP-TEST-CHAT-TEST.md](COMO-DEJAR-FUNCIONANDO-APP-TEST-CHAT-TEST.md) | Pasos concretos para que app-test y chat-test respondan 200 |
| [SOLUCIONES-CHAT-APP-TEST-API-IA.md](SOLUCIONES-CHAT-APP-TEST-API-IA.md) | Soluciones por problema (app-test 502, chat-test 500, api-ia 503) |
| [DIAGNOSTICO-CHAT-APP-TEST-NO-CARGAN.md](DIAGNOSTICO-CHAT-APP-TEST-NO-CARGAN.md) | Qué significa 502 vs 500 y qué revisar |
| [PRUEBAS-REALES-API-IA-API2.md](PRUEBAS-REALES-API-IA-API2.md) | Cómo generar y enviar evidencia a api-ia/api2 |

---

## Comando único

```bash
node scripts/ejecutar-pruebas-reales-todas.mjs
```

Da el estado de app-test, chat-test, api-ia y api2 y guarda la evidencia en `test-results/`.
