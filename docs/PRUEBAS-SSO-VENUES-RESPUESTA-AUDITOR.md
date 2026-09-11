# Pruebas SSO + Venues + respuesta al auditor (informes 2026-06-12)

## Contexto
Llegaron 4 informes (Trae/Claude cowork) auditando chat-dev. Cada uno reportaba bugs que, al
verificar en vivo, YA estaban arreglados — porque el auditor probaba sobre BUILDS VIEJOS.
Build actual con TODOS los fixes: **j1T0ZhrabYPVmZRCZ1xX_**.

## Prueba SSO (verificada en vivo, webkit)
| Verificación | Resultado |
|---|---|
| Cookie idTokenV0.1.0 Domain=.bodasdehoy.com se setea | ✅ |
| chat-dev lee la cookie SSO | ✅ |
| app-dev ve la MISMA cookie (cross-domain) | ✅ |
| "Sesión expirada" con cookie VÁLIDA | ❌ NO aparece |

**Conclusión:** la SSO NO está rota. Mecanismo correcto (SessionBridge: Domain=.bodasdehoy.com,
SameSite=Lax, Secure + renovación onIdTokenChanged). El informe vio "Visitante"/"Sesión expirada"
porque abrió chat-dev SIN cookie válida (sin login previo en app-dev, o Firebase token caducado ~1h).
Es comportamiento esperado, no bug.

## Prueba Venues (verificada en vivo, build actual)
| Bug del informe | Build actual |
|---|---|
| No dispara sendMessageInServer (crítico) | ✅ dispatched: true (SÍ se dispara) |
| Render en blanco | ✅ userBubble: true (se pinta) |
| Logo https://https// | ✅ doubleHttps: 0 |

**Nota técnica:** el composer es `contenteditable`, no `textarea`. La primera simulación falló
buscando `textarea` (selector), no por bug de la app.

## Estado consolidado de los 4 informes
| Hallazgo | Estado real (verificado) |
|---|---|
| Render en blanco | ✅ arreglado (fetch vacío ya no pisa optimistic) |
| No dispara envío | ✅ arreglado (se dispara) |
| Logo https://https// | ✅ arreglado (normalizeMediaUrl) |
| sessionId vacío | ⚠️ NO es bug (es el inbox; api-ia responde 200) |
| FOUC i18n / mezcla EN/ES | ✅ traducciones completas + fix FOUC |
| WhatsApp 422 (front) | ✅ arreglado (confirmado por el propio auditor) |
| <title> absorbe respuesta | ✅ truncado a 60 chars |
| SSO app-dev↔chat-dev | ✅ mecanismo funciona (requiere cookie válida) |
| **WhatsApp send 500 (backend)** | ❌ persiste — api-ia (traces) |
| **Hilo conversación vacío (backend)** | ❌ persiste — api-ia |

**Solo quedan 2 bugs REALES, ambos de backend api-ia. El front está al día.**

## Patrón a comunicar al auditor
Cada informe prueba un build anterior a los fixes → reporta bugs ya resueltos. Para que el próximo
informe sea útil: auditar sobre el BUILD_ID actual (verificable) y, para SSO, hacer login en app-dev
ANTES de abrir chat-dev (la SSO comparte sesión existente, no la crea de la nada).
