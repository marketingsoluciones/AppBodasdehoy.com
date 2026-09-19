# Plan de QA DETALLADO — Presupuesto + comunicación SSE (para equipo QA externo)

Fecha: 2026-07-03 (re-aplicado 2026-07-06) · Autor: COORD-AppEventos · Versión: 2
App: appEventos · Ruta: `/presupuesto` · Entorno recomendado: **dev** (`https://app-dev.bodasdehoy.com`) o local (`http://localhost:3220`)

> Documento para un equipo de QA que **no conoce el código**. Cada caso indica objetivo,
> precondición, pasos por UI, resultado esperado y criterio **PASS/FAIL** binario. La sección 6
> (SSE) incluye cómo mirar el tráfico en DevTools para verificar el streaming en tiempo real.

---

## 1. Contexto en 30 segundos
- El **Presupuesto** organiza el dinero del evento en **Categorías → Gastos → (Items) → Pagos**.
- Todo pertenece a un **evento**: primero abrir un evento y luego ir a **Presupuesto**.
- El **Copilot** (asistente IA, panel derecho) puede consultar y **modificar** el presupuesto.
  Al hacerlo, la pantalla debe **actualizarse sola** (sin recargar) gracias al **SSE**.
- **SSE** = "Server-Sent Events": canal por el que el servidor envía la respuesta del asistente
  y avisos de "recarga los datos" mientras escribe. Es lo que hay que verificar.

## 2. Roles, datos de prueba y entorno
| Rol | Qué ve | Cómo conseguirlo |
|---|---|---|
| **Owner** | Las 5 pestañas, incluida **Dashboard** | Usuario que creó el evento |
| **Colaborador** | Pestañas según permisos (si tiene permiso `presupuesto`) | Evento compartido con permiso de presupuesto |
| **Guest** | Pantalla "regístrate" (no datos reales) | Entrar sin iniciar sesión |

- Credenciales de prueba: pedir al equipo AppEventos las de `.env.e2e.dev` (3 usuarios).
- **Automatización: WebKit. NUNCA Chromium.** Para el bloque SSE, Chrome/Safari con DevTools.
- **NUNCA** modificar el evento "Boda Isabel & Raúl" (`66a9042dec5c58aa734bca44`). Crear evento propio y limpiarlo.

## 3. Cómo llegar a Presupuesto
1. Iniciar sesión. 2. En "Mis eventos", clic en una tarjeta de evento (o crear uno).
3. Barra superior → **"Presupuesto"**. 4. 5 pestañas: **Presupuesto · Detalle · Pagos · Pendiente · Dashboard** (Dashboard solo owner).

---

## 4. Descomposición funcional

### F1 · Acceso y permisos
| Caso | Objetivo | Pasos | Esperado (PASS) | Sev |
|---|---|---|---|---|
| F1.1 | Owner ve todo | Evento propio → Presupuesto | 5 pestañas (incl. Dashboard) | P0 |
| F1.2 | Colaborador | Evento compartido con permiso presupuesto | Ve Presupuesto; NO ve Dashboard | P1 |
| F1.3 | Guest | Sin login → `/presupuesto` | Pantalla "regístrate", NO datos | P1 |
| F1.4 | Sin cookie | Sesión caducada | Pantalla "vista sin cookie" (no crash) | P2 |
| F1.5 | Sin evento | Sin evento seleccionado | Skeleton/carga, no pantalla en blanco | P1 |

### F2 · Pestaña "Presupuesto" (resumen)
| Caso | Objetivo | Pasos | Esperado (PASS) | Sev |
|---|---|---|---|---|
| F2.1 | Ver categorías | Abrir Presupuesto | Lista de categorías; totales coherentes | P0 |
| F2.2 | Crear categoría | "Nueva categoría" → nombre → guardar | Aparece en lista y gráfico; total recalcula | P0 |
| F2.3 | Ver Estimado ON/OFF | Botón ⋮ → check "Ver Estimado" | ON muestra columna Estimado + habilita inputs; OFF los oculta/atenúa | P1 |
| F2.4 | Cambiar moneda | Desplegable de moneda → USD | Todos los importes con el símbolo nuevo | P1 |
| F2.5 | Editar Presupuesto Total | Campo "Presupuesto Total" → cifra → salir | Persiste tras recargar | P1 |
| F2.6 | Coste/pagado/por pagar | Tarjeta derecha | `Por pagar = coste_final − pagado`; cuadra | P0 |
| F2.7 | Gráfico | Ver gráfico de reparto | Refleja categorías e importes | P2 |
| F2.8 | Detalle → nuevo gasto | Clic categoría → añadir gasto | Aparece; coste categoría y total suben | P0 |
| F2.9 | Editar gasto | Editar celda de importe | Total categoría recalcula al instante | P0 |
| F2.10 | Borrar gasto | Borrar un gasto | Se elimina; totales bajan; sin error | P1 |
| F2.11 | Importar | "Importar" → plantilla | Carga categorías desde plantilla | P2 |
| F2.12 | Exportar Excel | Botón Exportar | Descarga `.xlsx` | P2 |
| F2.13 | Evento sin categorías | Presupuesto vacío | Modal de inicio (crear/duplicar) | P2 |

**FAIL si:** crear/editar/borrar NO actualiza totales sin recargar, o los números no cuadran.

### F3 · Pestaña "Detalle" (Excel)
| Caso | Objetivo | Pasos | Esperado (PASS) | Sev |
|---|---|---|---|---|
| F3.1 | Editar celdas | Detalle → editar importe gasto/item | Persiste y refleja en Resumen | P1 |
| F3.2 | Consistencia | Cambiar en Detalle y volver a Resumen | Mismos números | P1 |

### F4 · Pestañas "Pagos" y "Pendiente"
| Caso | Objetivo | Pasos | Esperado (PASS) | Sev |
|---|---|---|---|---|
| F4.1 | Pagos realizados | Pestaña Pagos | Tabla estado "pagado" | P0 |
| F4.2 | Pendientes | Pestaña Pendiente | Tabla estado "pendiente" | P0 |
| F4.3 | Registrar pago | Añadir pago a un gasto | Sube `pagado`; baja "por pagar"; visible en Resumen | P0 |
| F4.4 | Editar pago | Modificar importe/fecha | Recalcula totales | P1 |
| F4.5 | Ver soporte | Abrir factura/imagen | Muestra imagen en modal; cierra con X | P2 |

### F5 · Pestaña "Dashboard" (solo owner) — LIMITACIONES CONOCIDAS
| Caso | Objetivo | Pasos | Esperado (PASS) | Sev |
|---|---|---|---|---|
| F5.1 | Tarjetas resumen | Abrir Dashboard | fondos recibidos/disponibles, comprometido, directos, nº proveedores/transacciones | P1 |
| F5.2 | Registrar depósito | Formulario depósito → importe → enviar | Fondos suben en pantalla | P1 |
| F5.3 | Sub-pestañas | Dashboard/Depósitos/Reportes | Cambia contenido sin error | P2 |
| F5.4 | Pagos Directos/WP | Ver las dos listas | Clasifica por `pagado_por` | P2 |
| F5.5 | Resumen financiero | Bloque inferior | Presupuesto total, pagado, por otros, por WP | P2 |

> ⚠️ **NO reportar como bug (sin implementar aún):** botones "Generar reporte", "Exportar Excel"
> (Dashboard), "Hacer pago" (WP), "Ver/Imprimir depósito" y seleccionar reporte hoy **no hacen
> nada visible** (solo consola). Verificar solo que **no crashean**.

---

## 6. VERIFICACIÓN DE LA COMUNICACIÓN SSE (núcleo del encargo)

### 6.0 Cómo observar el SSE en DevTools
1. Chrome/Safari → **F12** → pestaña **Network**. 2. Filtro: **`chat`**.
3. Abrir Copilot → enviar un mensaje. 4. Clic en la petición **`chat`** (POST `/api/copilot/chat`):
   - **Status 200**; `content-type` = **`text/event-stream`**; en **Response/EventStream** líneas
     `data:`/`event:` llegando **progresivamente**.
5. Anotar `x-request-id` (y `x-backend-trace-id`) para reportar.

### 6.1 Bloque B — SSE camino feliz (en `/presupuesto`, Copilot abierto, con saldo)
| Caso | Mensaje al Copilot | Verificación SSE | Esperado (PASS) | Sev |
|---|---|---|---|---|
| B1 | "¿Cómo va mi presupuesto?" | 200 + text/event-stream; `data:` progresivos | Texto aparece palabra a palabra | P0 |
| B2 | "¿Qué categoría gasta más?" | `tool_start` → `tool_result` | Indicador "trabajando" → tarjeta/resultado | P1 |
| B3 | "Añade una partida Catering de 3000€" | `ui_action` `refresh_data` tras tool_result | **Nueva categoría en la tabla SIN recargar**; total sube | **P0** |
| B4 | "Muéstrame solo las partidas de decoración" | `ui_action` `filter` (budget_items) | Chip "Filtro activo · N partida(s)"; lista filtrada | P1 |
| B5 | Pulsar ✕ del chip (o "quita el filtro") | — | Chip desaparece; lista completa | P1 |
| B6 | "Borra todas las partidas" | `confirm_required` ANTES de ejecutar | Confirmación; sin confirmar NO borra nada | **P0** |
| B7 | Cualquier consulta | `usage` | Saldo/consumo actualizado; sin cobro indebido | P1 |

**Validar B3:** contar categorías antes; tras responder, **sin recargar**, debe haber una más. Si necesitas F5 → FAIL.

### 6.2 Bloque C — Degradación (lo más importante)
| Caso | Cómo forzarlo | Esperado (PASS) | Sev |
|---|---|---|---|
| C1 | Cortar red (Offline DevTools) justo tras que el Copilot diga que añadió/borró algo | App **avisa**/reintentar; NO afirma "hecho" con datos viejos. Al reconectar+recargar, el cambio real sí aparece | **P0** |
| C2 | Backend 503 | Error claro con RequestId/TraceId + Reintentar; NO burbuja vacía | P0 |
| C3 | Timeout >~100s | Stream corta con aviso; no cuelga infinito | P0 |
| C4 | 401 sesión | "No autorizado"; resto del presupuesto usable | P1 |
| C5 | 402 sin saldo | Mensaje + "Recargar saldo"; presupuesto no se rompe | P1 |
| C6 | 429 | Distingue "cuota agotada (X/Y)" vs "saturación temporal" | P2 |
| C7 | Reconexión | Tras corte, otro mensaje responde; sin duplicados | P1 |

**FAIL crítico:** tras fallo SSE la app dice "hecho" pero al recargar NO está (o al revés): datos desincronizados sin aviso.

### 6.3 Bloque D — Contexto de evento del Copilot
| Caso | Escenario | Esperado (PASS) | Sev |
|---|---|---|---|
| D1 | Evento abierto | En `/presupuesto`, "¿cuánto llevo gastado?" | Responde sobre ESE evento, sin preguntar cuál | P1 |
| D2 | Lista de eventos | En "Mis eventos", "dame la lista de pendientes" | NO responde sobre un evento al azar: pregunta cuál o modo "todos" | P1 |
| D3 | Cambio de evento (fullscreen) | Hablar de un evento y pedir otro por nombre | Cambia y lo confirma ("ahora sobre Boda X…") | P2 |

---

## 7. Reglas de ejecución y reporte
1. F1–F5 (funcional) primero, en verde antes de SSE.
2. **B3 y B6 bloqueantes (P0)**: si no auto-actualiza / no confirma borrado → parar y reportar.
3. Comprobar consola sin errores (rojo) en cada caso.
4. Baterías pequeñas (1-3) + limpiar datos entre tandas. Nunca tocar el evento protegido.
5. Reporte por incidencia: ID caso · Severidad · Entorno · Rol · Pasos · Esperado vs Observado ·
   RequestId/TraceId · Evidencia (captura + Network/EventStream).

## 8. Criterios PASS/FAIL globales
- ✅ PASS módulo: F1–F5 ok + B1–B7 ok + C1–C7 degradan con aviso (sin datos falsos) + D1–D3 coherentes.
- ❌ FAIL bloqueante: B3 no auto-actualiza · B6 no confirma borrado · C1/C2 datos desincronizados o
  burbuja vacía sin RequestId · un guest ve importes reales.
- ℹ️ No es bug: botones stub del Dashboard (F5) — solo que no crasheen.
