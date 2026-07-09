# Plan de trabajo QA + Brief — AppBodasdehoy (para compañero/a de QA)

> Documento para una **persona de QA**. Objetivo: validar por la **interfaz real** (como un
> usuario) la app de eventos y el chat, con **login real** (sin atajos), y reportar con evidencia.
> Fecha: 2026-07-09 · Autor: COORD-FRONT AppEventos.

---

## 0. Antes de empezar (2 minutos)

- **Entornos a probar (solo DEV):**
  - App de eventos: https://app-dev.bodasdehoy.com
  - Chat IA: https://chat-dev.bodasdehoy.com
- **NO tocar** los entornos `-test` ni producción.
- **Build actual desplegado:** `BUILD_ID tFeavJjMr2isKZS57CB5r` · `dev @ 05da414f`.
  Se ve abajo a la derecha en un recuadro oscuro (debug footer). Si no coincide, avisar antes de probar.
- **Navegador recomendado:** Safari o Chrome actualizado.

### Cómo entrar (LOGIN REAL — no hay atajos)
1. Ir a https://app-dev.bodasdehoy.com → te llevará al login (o pulsa "Iniciar sesión").
2. Entra con **email + contraseña** de una de las cuentas de prueba (te las pasa el equipo por canal seguro).
3. Verás tu avatar arriba a la derecha y la barra "Mis eventos / Resumen / Invitados…". Eso = sesión OK.
> ⚠️ Nota técnica: se eliminó un "modo bypass" de pruebas (era un riesgo de seguridad). Ahora
> **siempre** se entra con usuario y contraseña reales. Si alguien te dice de "activar bypass", NO.

### Reglas de oro de los datos
- **NUNCA modificar el evento "Boda Isabel & Raúl"** (es el evento base intocable).
- **Crea tus propios datos** de prueba (evento, invitados, etc.) y **bórralos al terminar** (cleanup).
- Trabaja en **lotes pequeños** (probar 3-4 cosas, reportar, seguir). Si algo falla 2 veces igual → **para y reporta** (no insistas).

---

## 1. Plan de trabajo por fases

Marca cada punto como ✅ Pasa / ❌ Falla / ⚠️ Dudoso. Adjunta captura siempre que falle.

### FASE 1 — Acceso y sesión (app-dev)
| # | Qué probar | Esperado |
|---|---|---|
| 1.1 | Entrar con email+contraseña | Entra, se ve el avatar y "Mis eventos" |
| 1.2 | Recargar la página (F5) **varias veces** | Sigue dentro; **no** vuelve a pedir login; los eventos **se ven siempre** |
| 1.3 | Cerrar sesión y volver a entrar | Sale limpio y vuelve a entrar sin problemas |
| 1.4 | Entrar en el chat (chat-dev) con la misma cuenta | Entra al chat; si ya estabas en la app, te reconoce (SSO) |

### FASE 2 — Mis eventos (/)
| # | Qué probar | Esperado |
|---|---|---|
| 2.1 | Ver la lista de eventos | Se ven las tarjetas; no sale vacío |
| 2.2 | Abrir el Copilot (barra lateral) en escritorio | Las tarjetas **NO se solapan** ni se deforman |
| 2.3 | Entrar en un evento (clic en su tarjeta) | Abre el Resumen de ese evento |

### FASE 3 — Resumen del evento (/resumen-evento)
| # | Qué probar | Esperado |
|---|---|---|
| 3.1 | Botón "Ver mis Itinerarios" (amarillo) | Texto **gris** legible; tamaño coherente con "Añadir Invitados" |
| 3.2 | "Sobre mi evento" → **Color** | **No** se rompe la pantalla; abre el selector de colores |
| 3.3 | Cambiar **Temporada / Estilo / Temática** | El valor se ve al instante, **sin error falso** y sin recargar |
| 3.4 | Campo **Tarta** | Se edita como **texto** (igual que Temática), **no** abre subida de imagen |
| 3.5 | Pasar el ratón por el **avatar del responsable** | El correo se ve **completo** (no cortado) |
| 3.6 | Buscador **"Lugar del evento"** | Muestra estados claros (cargando/resultados/sin resultados/error), deja **elegir** un lugar y **persiste** al recargar |
| 3.7 | Cambiar la **foto del evento** | La nueva foto se ve en el Resumen y **persiste** al recargar |

### FASE 4 — Invitados (/invitados)
| # | Qué probar | Esperado |
|---|---|---|
| 4.1 | **Crear invitado** | Aparece en la lista al instante; el "creado con éxito" **solo** si de verdad se guardó (recarga para confirmar) |
| 4.2 | **Editar invitado** | El cambio **persiste** al recargar; si falla el guardado, sale **aviso de error** (no silencio) |
| 4.3 | **Crear Grupo** | Se crea y aparece; si el servidor rechaza, sale **error real** (no éxito falso ni pantalla rota) |
| 4.4 | **Crear Menú** | Igual que Grupo |
> ⚠️ En 4.3/4.4, si sale un error REAL del servidor, **anótalo** (es posible problema de contrato backend, ya avisado).

### FASE 5 — Mesas (/mesas)
| # | Qué probar | Esperado |
|---|---|---|
| 5.1 | Plano/lienzo de mesas | Fondo **blanco con retícula gris clara** (no azul); mesas, sillas, zoom, arrastrar y seleccionar **funcionan** |

### FASE 6 — Copilot (barra lateral de la app)
| # | Qué probar | Esperado |
|---|---|---|
| 6.1 | Con un evento abierto, mirar la cabecera del Copilot | Dice **"Contexto: <nombre del evento>"** y responde sobre ESE evento |
| 6.2 | En "Mis eventos" (sin evento), abrir Copilot | Dice **"Contexto: todos tus eventos"** |
> ⚠️ Conversaciones largas del tipo "y sus invitados" pueden fallar → depende de 6 tareas de backend pendientes (no reportar como nuevo).

### FASE 7 — Chat IA / Bandeja (chat-dev, /messages) — bloque grande
| # | Qué probar | Esperado |
|---|---|---|
| 7.1 | 3 pestañas: Conversaciones / Bandeja / Historial | Cambian y cargan |
| 7.2 | Enviar mensaje al chat | Responde con **streaming** (texto que va apareciendo) |
| 7.3 | Mensajes en tiempo real entre 2 usuarios | Llegan al momento (SSE) |
| 7.4 | Notas internas (NotesPanel / @menciones) | Menciones en azul; evento sin notas dice "Aún no hay notas" (⚠️ si da error GraphQL = backend pendiente) |

### FASE 8 — Auth extra
| # | Qué probar | Esperado |
|---|---|---|
| 8.1 | Abrir un enlace **magic-link** `/auth/magic/[token]` | Procesa el token (no error 501) |
| 8.2 | Suscribirse a **notificaciones push** en Ajustes | Se suscribe sin error |

---

## 2. Cómo reportar cada incidencia
Para cada fallo, anota:
- **ID** (ej. 4.3), **severidad** (bloqueante / grave / menor), **entorno** (app-dev/chat-dev), **rol/cuenta**.
- **Pasos** para reproducir (1, 2, 3…), **qué esperabas** vs **qué pasó**.
- **Captura** (y si aparece algún código `RequestId`/`TraceId` en pantalla, cópialo).
- Envíalo al canal de coordinación con el formato del equipo.

---

## 3. Issues ya conocidos (NO reportar como nuevos)
- **Notas internas** en chat: error GraphQL `CRM_NotesResponse.notes` → **backend api-mcp** pendiente.
- **Copilot en conversaciones largas** (multi-turno): **6 tareas backend api-ia** pendientes.
- **Botones del Dashboard de Presupuesto** (Generar reporte, Exportar Excel, Hacer pago WP): sin implementar; solo verificar que **no rompen** la pantalla.
- **Crear Grupo** puede dar error de contrato backend (en revisión).

---

## 4. Follow-up para el DEV (no para QA)
- El E2E `ui-smoke-dev.spec.ts` ya usa **login real** (se quitó el bypass inseguro). Pero el
  **selector de la tarjeta de evento** en `helpers.ts` (`loginAndSelectEvent`) está desactualizado
  respecto al DOM actual (la tarjeta es `.cardEvento`), por lo que el click a la tarjeta falla
  **después** de un login correcto. Actualizar ese selector para que la suite quede verde.
  Evidencia: el login entra bien (avatar visible), solo falla el click de tarjeta.
- Diagnóstico completo del login: `docs/DIAGNOSTICO-LOGIN-2026-07-09.md`.
