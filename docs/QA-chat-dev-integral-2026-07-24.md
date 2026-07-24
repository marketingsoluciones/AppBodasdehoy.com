# QA integral chat-dev — 24-jul-2026 (avanzado)

**Entorno:** `https://chat-dev.bodasdehoy.com`
**Sesión:** login real (credenciales del repo — `.env.e2e.dev`, 3 users). NUNCA tocar "Boda Isabel & Raúl" (`66a9042dec5c58aa734bca44`).
**Cómo reportar:** por cada caso → ✅ PASA / ❌ FALLA + captura + (si falla) qué viste vs qué se esperaba + errores de consola.
**Regla de oro:** ten la **consola del navegador abierta** (F12 → Console + Network) durante TODA la sesión. Muchos criterios son "no debe aparecer X error".

---

## Batería A — Auth y sesión (raíz del informe anterior: Firebase HD-05)

> Contexto: se desbloqueó `securetoken` en Firebase (proyecto `bodasdehoy-1063`). Esta batería valida que ya no se cae la sesión.

| # | Paso | Resultado esperado (PASA) |
|---|------|---------------------------|
| A1 | Entrar a `/` **sin** sesión (incógnito) | NO aparece el banner rojo "Tu cuenta ha caducado". A un invitado nuevo no se le dice "expirada". |
| A2 | Login real → esperar 30s navegando | En consola **NO** debe salir `securetoken...are-blocked` ni "Sesión Firebase perdida tras 3 intentos". |
| A3 | Con sesión, clic en **"Pendientes"** (rail/lateral) | Abre `/pendientes` con su vista propia. **NO** rebota a `/asistente`. |
| A4 | Con sesión, ir a **Archivos** (`/files`) | Muestra tus archivos. **NO** cae a "Archivos para usuarios registrados / Crear cuenta". |
| A5 | Navegar Bandeja↔Asistente↔Files varias veces | La UI NO alterna entre "logueado" y "visitante". Avatar y nombre estables. |
| A6 | Recargar (F5) estando logueado en `/bandeja` | No aparece "Acceso requerido" ni spinner infinito; carga la bandeja. |

**Criterio batería A:** consola sin pérdida de sesión + /pendientes y /files estables + sin banner "caducado" a invitados.

---

## Batería B — Multi-marca (Bandeja en la paleta del whitelabel)

> La Bandeja NO debe pintarse morada; debe usar el color de **cada marca**. bodasdehoy = rosa coral `#F7628C`.

| # | Paso | Resultado esperado |
|---|------|--------------------|
| B1 | Abrir `/bandeja` en bodasdehoy | Elementos de marca (item activo del rail, botones primarios, filtros activos, "N sin leer", "escribiendo…") en **rosa coral**, NO morado ni azul. |
| B2 | Selector de ámbito (scope) — modo Soporte | Pastilla en tono de marca (rosa claro), no lila. |
| B3 | Enviar/recibir en una conversación | Burbuja del equipo en color de marca; burbuja del contacto blanca; **radio asimétrico con "cola"**. |
| B4 | Estado de carga de la bandeja (spinner) | El spinner y el botón "Ir a login" en color de marca. |
| B5 | (si hay acceso a otro whitelabel) repetir B1 | Ese whitelabel se ve en SU color (no rosa, no morado). |
| B6 | Semánticos NO cambian | RSVP (verde/ámbar/rojo), badges de canal (WA verde, IG rosa) siguen fijos, no se tiñen de marca. |

**Criterio batería B:** cero morado de marca en superficies visibles; semánticos intactos.

---

## Batería C — Composer por canal (HD-01)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| C1 | Abrir una conversación **Web** | Composer normal: "Responder" activo + caja de texto + envío. |
| C2 | Abrir una **WhatsApp** dentro de ventana 24h | Igual que Web (respuesta libre). |
| C3 | Abrir una **WhatsApp con ventana 24h expirada** | Aparece el **picker de plantillas HSM** (no deja texto libre como acción principal). |
| C4 | Abrir un **Status / Newsletter / Broadcast** | Banda **"📢 Canal informativo: no admite respuesta externa. Solo nota interna."** + botón "Responder" **deshabilitado** (gris) + modo "Nota interna" activo. |
| C5 | En C4, intentar pulsar "Responder" | No se activa; solo permite Nota interna. |

**Criterio batería C:** el composer comunica el modo real del canal; status/broadcast NO sugiere respuesta libre.

---

## Batería D — Chat y persistencia (bugs 5+6 — DEPENDE DE BACKEND)

> ⚠️ Si backend aún no ha migrado la persistencia a api-ia, D2–D4 fallarán (esperado). Reportar igualmente.

| # | Paso | Resultado esperado (cuando backend esté) |
|---|------|-------------------------------------------|
| D1 | `/asistente` → enviar un prompt | La IA responde (esto YA funciona). |
| D2 | En una conversación, enviar mensaje | NO aparece "Sincronizado" y luego error. El estado del mensaje refleja la realidad ("Enviado" / "error" si falla), no un optimista falso. |
| D3 | Enviar mensaje y esperar | NO hay banner "No se pudo guardar el mensaje"; en Network, `sendMessageInServer` NO da 500. |
| D4 | Abrir una conversación con historial previo | Carga los mensajes anteriores, NO el saludo genérico. |
| D5 | "Analizando tu solicitud…" tras responder | El encabezado se limpia al terminar (no queda pegado). |

**Criterio batería D:** enviar y recuperar historial sin 500 ni mensajes contradictorios.

---

## Batería E — Cowork /agentes (backend prefix ya arreglado)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| E1 | Ir a `/agentes` | Carga la lista de agentes (sessions reales). |
| E2 | Seleccionar un agente → ver canales | Los canales asignados cargan (per-agente). Toggle de canal persiste. |
| E3 | Ver métricas del agente | Muestra respuestas/resueltos/tiempo (hoy), no vacío/mock. |
| E4 | Activar/pausar un agente | El estado persiste (recargar y sigue igual). |

**Criterio batería E:** canales y métricas per-agente reales; nada de "PRÓXIMAMENTE/BETA".

---

## Batería F — Perfil A4 + Contacto R2

| # | Paso | Resultado esperado |
|---|------|--------------------|
| F1 | Perfil → sección **"Cuentas vinculadas"** | Lista tus métodos (Google/Facebook/email). Permite desvincular con confirmación. NO deja desvincular el único método. |
| F2 | Bandeja → conversación con contacto CRM → desplegar "Detalles" | Aparece panel **"Conversaciones de [contacto]"** agrupadas Marca/Evento, con RSVP + no-leídos + navegación. |

**Criterio batería F:** A4 y R2 visibles y funcionales con datos reales.

---

## Batería G — Fugas / marca / consola (calidad)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| G1 | Modal Compartir → Captura de pantalla → pie | NO aparece `github.com/marketingsoluciones/planner-ai` (repo interno). Debe ser `bodasdehoy.com`. |
| G2 | Login → titular rotativo | "…organizar tu **boda**…" (el rotativo pasa por boda/comunión/…/cumpleaños — es intencional; solo confirmar que arranca coherente). |
| G3 | Bandeja en desktop ancho (≥1360px) | La bandeja ocupa TODO el ancho; NO deja franja negra a la derecha. |
| G4 | Consola durante toda la sesión | Sin `React #418` recurrente, sin pérdida de sesión, sin 500 en navegación normal. |

---

## Resumen de criterios de aceptación (del informe anterior)
- [ ] Hilo de respuesta libre → permite escribir, deja claro que el envío está permitido (C1/C2).
- [ ] Hilo solo-plantilla → NO muestra textarea libre como acción principal (C3).
- [ ] Hilo bloqueado/status → explica por qué no se puede responder (C4).
- [ ] `/pendientes` abre su vista propia, no vuelve a `/asistente` (A3).
- [ ] `/files` mantiene sesión, no cae a visitante (A4).
- [ ] Consola sin pérdida de sesión ni errores críticos de render (A2/G4).

## Qué está bloqueado por backend (si falla, NO es del front)
- **Batería D (persistencia)** → api-ia (decisión de migrar a su lobechat_adapter). Bloqueador crítico abierto.
- **Bug 12** (lista "web" vacía), **evento duplicado / datos ajenos** (api-mcp), **`channel` en WhatsAppConversation** (navegación R2).
