# QA MASTER — AppEventos (navegador · simulando usuario · con casos de error)

> **Protocolo de QA completo y avanzado.** Diseñado para ejecutarse **desde un navegador**,
> **simulando a un usuario real** (login real, clics reales, sin atajos/bypass), y probando
> tanto el **camino feliz** como los **casos de error** (pruebas negativas). Sirve para una
> persona de QA o para un agente de navegación.
>
> - **Entorno:** https://app-dev.bodasdehoy.com · chat: https://chat-dev.bodasdehoy.com (SOLO dev)
> - **Build objetivo:** `Ghy-9WfP_ygTnykPfor4d` (dev @ `f4004027`). Verifícalo en el **debug footer**
>   (recuadro oscuro abajo-derecha: `dbg <commit> | sB … iT`). Si no coincide, avisar antes de probar.
> - **Fecha:** 2026-07-12 · **Autor:** COORD-FRONT AppEventos

---

## 0. Preparación y método

### Reglas de oro
1. **Login REAL** con email + contraseña (no hay bypass). Confirma tu avatar arriba-derecha.
2. **NUNCA** tocar el evento protegido **"Boda de Isabel & Raúl"** (`66a9042dec5c58aa734bca44`).
   Trabaja sobre un evento de prueba tuyo (ej. "ITEL2 S.L PRUEBA") y **borra** lo que crees (cleanup).
3. Trabaja en **lotes pequeños** (3–4 pruebas → registra → sigue). **2 fallos iguales → PARA** y reporta.
4. Ten abierta la **consola del navegador (F12)** y la pestaña **Red** durante todo el test.
5. Apunta la **HORA exacta** de cada prueba (el backend `api-mcp` ha tenido inestabilidad
   intermitente — la hora permite correlacionar un fallo con una caída del servidor).

### Cómo distinguir bug real vs inestabilidad de backend
- Si un guardado/carga falla **una vez** y al **reintentar funciona** → probable **backend intermitente** (no bug de front). Anótalo igual con la hora + el `ref: trc_...` si aparece.
- Si falla **siempre igual** con el **mismo mensaje** → probable **bug de front/contrato** → ticket.
- Una pantalla en **vista de invitado** ("Iniciar sesión") cuando deberías estar logueado = el login no cuajó (recarga; si persiste, es sesión, no el módulo).

### Errores de consola conocidos (NO reportar como nuevos)
- `Minified React error #418` (hidratación) · `react-i18next sin instancia` · `[getThemeColors] TypeError` (viene de un embed/lib, no de appEventos) · abortos de red hacia `chat-dev`. Son ruido no bloqueante.

### Plantilla de registro (para CADA prueba)
```
ID | Módulo | Hora | Resultado (✅ pasa / ❌ falla / ⚠️ intermitente / 🚫 bloqueado)
Pasos exactos: 1) … 2) … 3) …
Esperado: …
Observado: … (copia el TEXTO EXACTO de cualquier error/toast)
ref / TraceId / RequestId: …
Consola (errores rojos relevantes): …
¿Persiste tras recargar (F5)?: sí / no
Captura adjunta: sí / no
```

---

## 1. ACCESO Y SESIÓN

### 1A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| S-1 | Entrar con email+contraseña | Entra al dashboard, avatar visible |
| S-2 | Recargar (F5) **5 veces seguidas** | Los eventos se ven **SIEMPRE**; no pide re-login |
| S-3 | Cerrar sesión → volver a entrar | Sale limpio y reentra sin problemas |
| S-4 | Login en chat-dev con la misma cuenta | SSO: te reconoce sin re-login |

### 1B · Casos de ERROR (pruebas negativas)
| ID | Provocar el error | Esperado (error controlado, NO crash) |
|----|-------------------|----------------------------------------|
| S-E1 | Login con **contraseña incorrecta** | Mensaje claro "usuario o contraseña inválida"; NO pantalla rota |
| S-E2 | Login con **email inexistente** | Mensaje claro; NO cuelgue infinito |
| S-E3 | Login con **campos vacíos** → Enviar | Validación de formulario (no deja enviar) |
| S-E4 | OAuth Google → **cerrar el popup a medias** | No se queda "Conectando…" para siempre (timeout de seguridad ~3s) |
| S-E5 | Abrir una **ruta protegida sin sesión** (`/invitados` en ventana incógnito) | Vista demo/upsell o redirección a login; NO datos reales |

---

## 2. MIS EVENTOS (home `/`)

### 2A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| E-1 | Ver lista de eventos | Se ven las tarjetas; **separación clara** entre las pestañas (Pendientes/Archivados/Realizados) y el grid |
| E-2 | Abrir **Copilot** (barra lateral) en escritorio | Las tarjetas **NO se solapan** ni se deforman |
| E-3 | Entrar en un evento (clic tarjeta) | Abre el Resumen de ese evento |
| E-4 | **Crear un evento** nuevo | Se crea y aparece; con **grupos por defecto** según el tipo |
| E-5 | Cambiar de pestaña Pendientes/Archivados/Realizados | Filtra correctamente |

### 2B · Casos de ERROR
| ID | Provocar | Esperado |
|----|----------|----------|
| E-E1 | 🔴 **Refrescar repetidamente** (F5 x5–10) con sesión activa | Los eventos **reaparecen solos** (auto-reintento); **nunca** hace falta logout/login. Si sale "no se pudieron actualizar… mostrando datos guardados" es aceptable (se recupera solo) |
| E-E2 | Crear evento **sin nombre** / campos obligatorios vacíos | Validación; no crea evento inválido |
| E-E3 | Archivar/borrar un evento y **recargar** | El cambio persiste; no reaparece el evento borrado |
| E-E4 | Abrir el buscador de imagen/hero y **subir un archivo enorme o no-imagen** | Error controlado (no crash) |

---

## 3. RESUMEN DEL EVENTO (`/resumen-evento`)

### 3A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| R-1 | Botón amarillo "Ver mis Itinerarios" | Texto **gris legible**, tamaño coherente con "Añadir Invitados" |
| R-2 | "Sobre mi evento" → **Color** | **NO crashea**; abre selector de colores |
| R-3 | Cambiar **Temporada / Estilo / Temática** | Valor al instante, **sin error falso**, sin recargar |
| R-4 | Campo **Tarta** | Se edita como **texto** (igual que Temática), **no** abre subida de imagen |
| R-5 | Hover en el **avatar del responsable** | El correo se ve **completo** (no cortado) |
| R-6 | **Foto del evento**: cambiarla | Se ve en el Resumen y **persiste** al recargar |
| R-7 | Banner: avatares + botón "+" | Alineados, el "+" **no se solapa** con los avatares |

### 3B · Casos de ERROR
| ID | Provocar | Esperado |
|----|----------|----------|
| R-E1 | Buscador **"Lugar del evento"**: escribir algo sin resultados | Estado claro **"sin resultados"** (no pantalla vacía ambigua) |
| R-E2 | Buscador "Lugar": si sale **"error al cargar"** | Es el servicio `getAllBusinesses` (backend) → **reportar aparte** con la hora |
| R-E3 | Elegir un lugar y **recargar** | El lugar **persiste** |
| R-E4 | Cambiar Temporada/Estilo con el **backend lento** | Si falla, **error real** (no falso "guardado"); reintentar |

---

## 4. INVITADOS (`/invitados`)  ⭐ (foco: create + importación)

### 4A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| I-1 | **Crear invitado** (nombre, correo, teléfono válidos) | Aparece en la lista **al instante**; toast de éxito **solo si se guardó** (recarga para confirmar) |
| I-2 | **Editar invitado** | El cambio **persiste** al recargar |
| I-3 | **Crear Grupo** | Se crea y aparece |
| I-4 | **Crear Menú** | Se crea y aparece |
| I-5 | **Descargar plantilla** (Importar → Descargar plantilla) | Descarga un `.xlsx` real (NO abre página `Cannot GET`) |
| I-6 | **Subir Excel** con la plantilla rellena (datos válidos) | Importa los invitados; aparecen en la lista |
| I-7 | Generar **PDF de invitados** | Descarga el PDF |

### 4B · Casos de ERROR (¡clave!)
| ID | Provocar | Esperado |
|----|----------|----------|
| I-E1 | Crear invitado con **correo inválido** (`abc`) | Validación de formato; no crea |
| I-E2 | Crear invitado **duplicado** (mismo correo o teléfono que uno existente) | Aviso de duplicado / no duplica silenciosamente |
| I-E3 | Crear invitado con **campos obligatorios vacíos** | Validación; no envía |
| I-E4 | **Subir Excel con cabeceras mal** (ej. "Nombre" en minúscula, "Teléfono" con acento) | Debe **tolerarlo** e importar igual (cabeceras case/acento-insensibles) |
| I-E5 | **Subir Excel con 1 fila incompleta** entre varias buenas | Importa las **buenas** y **detalla** qué fila/campo falló (ej. "fila 4 falta CORREO"); NO aborta todo el lote |
| I-E6 | **Subir un archivo que NO es .xlsx** (ej. .png renombrado) | Mensaje "selecciona un .xlsx válido"; no crash |
| I-E7 | **Subir Excel vacío** (solo cabeceras) | Mensaje claro "no se importó nada" (no falso éxito) |
| I-E8 | Crear Grupo/Menú **con el backend caído** | **Error REAL** (no falso "creado con éxito" ni pantalla rota). ⚠️ Si el error es del servidor, anota hora + `ref` (posible inestabilidad api-mcp, ver §9) |

---

## 5. MESAS (`/mesas`)

### 5A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| M-1 | Cargar el plano | Fondo **blanco con retícula gris clara** (no azul) |
| M-2 | Crear mesa, arrastrar, zoom, seleccionar | Funciona fluido |
| M-3 | **Sentar** un invitado en una mesa | Se sienta; se refleja |
| M-4 | **Levantar** un invitado de la mesa | Se levanta |

### 5B · Casos de ERROR
| ID | Provocar | Esperado |
|----|----------|----------|
| M-E1 | **Sentar en una mesa llena** (todos los puestos ocupados) | Aviso "la mesa tiene todos los puestos ocupados"; no rompe |
| M-E2 | Crear mesa con **plantilla inválida** (arrastre incompleto) | "Tipo de mesa inválido…"; no crash |
| M-E3 | Editar mesa y **recargar** | Persiste |

---

## 6. PRESUPUESTO (`/presupuesto`)

### 6A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| P-1 | Cargar `/presupuesto` | Muestra categorías, coste final, pagado/por pagar; **sin "Comprobando sesión…"** ni pantalla roja |
| P-2 | Cambiar tabs internos (Pagos Pendientes / Detallado / Dashboard) | Cambian sin error |
| P-3 | Navegación mixta Invitados→Presupuesto→Pagos→Mesas | Fluye sin salto al home |
| P-4 | Añadir/editar un **pago** | Se guarda; se refleja |

### 6B · Casos de ERROR
| ID | Provocar | Esperado |
|----|----------|----------|
| P-E1 | Añadir pago con **importe vacío / no numérico / negativo** | Validación; no guarda basura |
| P-E2 | Botones **stub** (Generar reporte, Exportar Excel, Hacer pago WP) | No implementados → solo verificar que **no crashean** la pantalla |
| P-E3 | Abrir `/presupuesto` con **Copilot abierto** | No reaparece el crash histórico |

---

## 7. ITINERARIO / TAREAS

| ID | Pasos | Esperado |
|----|-------|----------|
| T-1 | Ver timeline del evento | Carga |
| T-2 | **Editar una tarea** y guardar | Se guarda; se refleja |
| T-E1 | Editar tarea con el **backend caído** | Sale **aviso de error** (ya no falla en silencio) — NO se queda sin feedback |

---

## 8. COPILOT (barra lateral)

### 8A · Camino feliz
| ID | Pasos | Esperado |
|----|-------|----------|
| C-1 | Con un evento abierto, mirar la cabecera del Copilot | Dice **"Contexto: \<nombre del evento\>"** |
| C-2 | En "Mis eventos" (sin evento) → Copilot | Dice **"Contexto: todos tus eventos"** |
| C-3 | Preguntar de **lectura**: "¿Cuántos invitados confirmados tengo?" | Responde con datos reales del evento |
| C-4 | Pedir **filtrar** ("muéstrame la mesa 1") | Aplica el filtro / navega |

### 8B · Casos de ERROR
| ID | Provocar | Esperado |
|----|----------|----------|
| C-E1 | Pedir una **acción de ESCRITURA** ("crea un invitado llamado X") | Aparece un **modal de confirmación (Cancel/OK)**. Al pulsar **OK** ejecuta y **el modal desaparece**; al pulsar **Cancel** se cierra. ⚠️ **Si el modal se queda pegado tras confirmar/cancelar → BUG** (reportar con captura) |
| C-E2 | Conversación **larga / multi-turno** ("¿y sus invitados?") | Puede fallar → depende de **6 tareas backend api-ia** pendientes (no reportar como nuevo) |
| C-E3 | Si sale error del asistente | Debe mostrar **mensaje claro + `ref: trc_...`** (código para reportar). Copia el `ref` |
| C-E4 | Si sale **"Saldo insuficiente"** (402) o **"demasiadas peticiones"** (429) | Mensaje amigable + enlace a recargar / cuándo reintentar |

---

## 9. INVITACIONES (`/invitaciones`) — multicanal

| ID | Pasos | Esperado |
|----|-------|----------|
| V-1 | Abrir el **editor de email** | Carga el editor |
| V-2 | Seleccionar/editar una **plantilla** | Funciona |
| V-3 | Configurar/enviar por **WhatsApp** (asistente de setup) | Flujo completo sin crash |
| V-4 | Ver **enviados** + contador | Coherente |
| V-E1 | Enviar **sin seleccionar destinatarios** | Validación; no envía en vacío |
| V-E2 | WhatsApp **sin saldo / sin configurar** | Mensaje claro (recarga/config); no crash |

---

## 10. NAVEGACIÓN GLOBAL Y AUTH EXTRA

| ID | Pasos | Esperado |
|----|-------|----------|
| N-1 | Menú superior **Novia / Novio / Proveedores / Lugares** | Llevan al **sitio de marketing** (`https://bodasdehoy.com/...`), **NO a 404** en la app |
| N-2 | Abrir un enlace **magic-link** `/auth/magic/[token]` | Procesa el token (no error 501) |
| N-3 | Suscribirse a **notificaciones push** (Ajustes) | Se suscribe sin error |
| N-E1 | Navegar a una **ruta inexistente** `/xyz` | 404 controlado de la app (no pantalla en blanco) |

---

## 11. CASOS DE ERROR TRANSVERSALES (avanzado)

Prueba estos con las herramientas del navegador (F12 → Network → throttling / offline):
| ID | Provocar | Esperado |
|----|----------|----------|
| X-1 | **Red lenta** (throttling "Slow 3G") al guardar invitado/pago | Spinner/estado de carga; si falla, error claro; al reintentar en red normal, funciona |
| X-2 | **Offline** (Network → Offline) y navegar | Estados de error/caché razonables; no pantallas en blanco mudas |
| X-3 | **Sesión expirada** (borrar cookie `idTokenV0.1.0` y navegar) | Redirección a login o vista invitado; no bucle |
| X-4 | **Doble clic rápido** en "Crear invitado / Guardar" | No crea duplicados por doble envío |
| X-5 | Recargar **en medio** de un guardado | No deja datos a medias inconsistentes |

---

## 12. Fixes recientes a validar específicamente (regresión)
Marca ✅/❌ que cada uno sigue bien en este build:
- [ ] Importar Excel robusto (I-6, I-E4/E5/E6/E7)
- [ ] Descargar plantilla (I-5)
- [ ] "Mis eventos" no queda vacío tras refresh (E-E1)
- [ ] Editar tarea no falla en silencio (T-E1)
- [ ] Menú superior no da 404 (N-1)
- [ ] Copilot muestra `ref` en errores (C-E3) y contexto de evento (C-1/C-2)
- [ ] Separación pestañas↔grid (E-1) + teléfono del hero proporcionado
- [ ] Crear Grupo/Menú/Invitado (I-1/I-3/I-4) — ⚠️ ojo a inestabilidad backend (§ siguiente)

---

## 13. Issues conocidos (NO reportar como nuevos)
- 🔴 **`api-mcp` (backend) inestable de forma intermitente** (reinicios + picos de latencia ~9s). Puede hacer que **guardar Invitado/Grupo/Menú falle a ratos**. Si falla, **reintenta**: si a la 2ª va, es esto (escalado a backend P1). Anota hora + `ref`.
- **Notas internas del chat** (`CRM_NotesResponse.notes`) → backend pendiente.
- **6 tareas Copilot backend** (multi-turno robusto) → api-ia pendiente.
- **Botones stub Presupuesto** (P-E2) → sin implementar.
- **BUG #3 (modal Copilot)**: **en investigación** — reproducir SOLO con acción de escritura (C-E1) y captura del modal real.

---

## 14. Cómo entregar el reporte
Por cada incidencia usa la **plantilla de §0**. Envía al canal de coordinación
(`C0AV8EV5495`, hilo AppBodas) con formato **DE / PARA / DRI / ASUNTO** y adjunta capturas.
Ordena por severidad: 🚫 bloqueante → ❌ grave → ⚠️ menor/intermitente.
