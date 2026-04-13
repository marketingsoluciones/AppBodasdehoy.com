# AUDITORÍA: Planes, Límites y Enforcement
> Generado: 2026-04-06
> Objetivo: para cada funcionalidad visible al usuario, verificar si el límite mostrado está realmente aplicado en sistema

---

## Leyenda de estado

| Símbolo | Significado |
|---|---|
| ✅ | Correcto y enforced |
| 🖥️ | Solo UI — se muestra pero NO se aplica técnicamente |
| ❌ | Incorrecto o sin implementar |
| 🚫 | No existe en código/BD |
| ⚠️ | Existe en BD pero no se muestra al usuario |
| 🔴 | Discrepancia crítica entre UI y BD |
| 🟡 | Pendiente de decisión de negocio |
| 🟢 | Alineado en las 3 fuentes (spreadsheet + UI + BD) |

---

## Cómo se aplican los límites (arquitectura)

```
Usuario manda mensaje
       ↓
route.ts → X-User-ID + X-Development → api-ia
       ↓
api-ia: wallet_checkBalance(sku="ai-tokens", amount)
       ↓
  SI saldo/cuota insuficiente → 402 insufficient_balance
  SI cuota diaria superada    → 429 rate_limit
       ↓
generateAIChat.ts → showInsufficientBalance=true
       ↓
InsufficientBalanceModal aparece
```

**SKUs que se gatean de verdad:** `ai-tokens` (quota mensual + daily cap), `image-gen`, `whatsapp-msg`, `email-campaigns`, `sms-invitations`, `storage-gb`, `memories-albums`, `memories-photos`, `events-count`, `guests-per-event`

**Feature restrictions que son SOLO UI:** `api_access`, `priority_support`, `white_label`, `advanced_analytics`, `custom_integrations`, `max_users`, `global_discount`

---

## PLAN FREE (0€)

### Sección: Organiza tus eventos

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Eventos activos | 🚫 no visible en plans page | `events-count: 1` | ✅ SKU quota | ⚠️ | ¿Mostrar "1 evento" en la card? |
| Lista de invitados | 🚫 no visible | `guests-per-event: 50` | ✅ SKU quota | ⚠️ | ¿Mostrar "hasta 50 invitados"? |
| Planos del evento | 🚫 no visible | sin SKU | ❌ sin gateo | 🟡 | ¿Es feature de todos los planes? |
| Presupuesto | 🚫 no visible | sin SKU | ❌ sin gateo | 🟡 | ¿Es feature de todos los planes? |
| Tareas e itinerarios | 🚫 no visible | sin SKU | ❌ sin gateo | 🟡 | ¿Es feature de todos los planes? |
| Chat con proveedores | 🚫 no visible | sin SKU | ❌ sin gateo | 🟡 | ¿Es feature de todos los planes? |
| Colaboradores | 🚫 no visible | `max_users: 1` | ❌ no enforced | ⚠️ | Solo 1 usuario — ¿bloquear añadir colaboradores? |

**[ ] VERIFICAR EN VIVO:** Crear 2 eventos con cuenta FREE — ¿bloquea al crear el 2º?
**[ ] VERIFICAR EN VIVO:** Añadir 51 invitados — ¿bloquea al pasar de 50?

---

### Sección: Asistente inteligente IA

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Consultas IA (~100/mes) | ✅ "~100 consultas IA" | `ai-tokens: 50,000` | ✅ api-ia quota | 🟢 | OK |
| Límite diario IA | ✅ visible en plans ("~10 consultas/día") | `daily_quota: 5,000` activo | ✅ api-ia 429 | 🟢 | OK — añadido a extractLimits en planes/page.tsx |
| QuotaBanner en chat | ✅ barra + alerta | basado en uso mensual | ✅ frontend | 🟢 | OK |
| QuotaBanner diario | ✅ warning 80-99% + block 100% | daily_quota existe | ✅ frontend | 🟢 | OK — añadido aviso amarillo 80-99% |
| Imágenes IA | 🚫 no se muestra (FREE=0) | `image-gen: 5` | ✅ quota | 🔴 | BD tiene 5, debería ser 0. Corregir BD |
| Copiloto IA | ✅ | siempre activo | ✅ | 🟢 | OK |
| Generación de código | 🚫 no en plans page | sin SKU propio | ❌ sin gateo | 🟡 | ¿Debe ser FREE o BASIC+? |
| Web Browsing | 🚫 no en plans page | sin SKU propio | ❌ sin gateo | 🟡 | ¿Debe ser FREE o BASIC+? |
| Venue Visualizer (diseño espacios) | 🚫 no en plans page | sin SKU propio | ❌ sin gateo | 🟡 | ¿Debe ser FREE o BASIC+? |

**[ ] VERIFICAR EN VIVO:** Enviar ~100 consultas IA con cuenta FREE — ¿bloquea?
**[ ] VERIFICAR EN VIVO:** Enviar ~10 consultas seguidas rápido — ¿daily cap actúa?
**[ ] VERIFICAR EN VIVO:** Intentar generar imagen con FREE — ¿permite hasta 5 o bloquea?

---

### Sección: Comunica y escala

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| WhatsApp | 🚫 no visible (correcto, FREE=❌) | sin SKU ✅ | ✅ no SKU = bloqueado | 🟢 | OK |
| Email campaña | 🚫 no visible | `email-campaigns: 10` | ✅ quota | ⚠️ | ¿Mostrar u ocultar? Spreadsheet no lo menciona |
| SMS | 🚫 no visible | sin SKU | ✅ no incluido | 🟢 | OK |
| Widget visitantes (/widget) | 🚫 no en plans | disponible sin gateo | ❌ | 🟡 | ¿Qué plan requiere el widget? |
| Confirmación de asistencia (RSVP) | 🚫 no en plans | disponible | ❌ | 🟡 | ¿Es de todos los planes? |

**[ ] VERIFICAR EN VIVO:** Intentar enviar WhatsApp con FREE — ¿bloquea?
**[ ] VERIFICAR EN VIVO:** Intentar enviar email con FREE — ¿permite 10 o bloquea?

---

### Sección: Soporte y almacenamiento

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Almacenamiento 1 GB | ✅ "1 GB" | `storage-gb: 1` | ✅ quota | 🟢 | OK |
| Memories álbumes | 🚫 no en plans page | `memories-albums: 1` | ✅ quota | ⚠️ | ¿Mostrar en plans? |
| Memories fotos | 🚫 no en plans page | `memories-photos: 50` | ✅ quota | ⚠️ | ¿Mostrar en plans? |
| Web de boda (creator) | 🚫 no en plans | sin gateo | ❌ | 🟡 | ¿Es de todos los planes? |
| Soporte Comunidad | ✅ "Comunidad" | `priority_support: false` | 🖥️ solo UI | 🖥️ | OK para marketing |
| Wallet prepago | ✅ | siempre activo | ✅ | 🟢 | OK |
| Descuentos | ✅ ❌ correcto | `global_discount: null` | 🖥️ solo UI | 🟢 | OK |
| API acceso | 🚫 no visible (correcto) | `api_access: false` | 🖥️ solo UI, no enforced | ⚠️ | ¿Necesitamos gatear API real? |
| Gestor dedicado | 🚫 no visible (correcto) | `white_label: false` | 🖥️ solo UI | 🟢 | OK |
| Créditos mensuales (100) | 🚫 no existe | 🚫 sin SKU | ❌ | 🟡 | **DECISIÓN PENDIENTE** |

**[ ] VERIFICAR EN VIVO:** Subir fotos superando 1GB — ¿bloquea?
**[ ] VERIFICAR EN VIVO:** Crear 2 álbumes con FREE (límite=1) — ¿bloquea?

---

## PLAN BÁSICO (9,99€)

### Sección: Organiza tus eventos

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Eventos ilimitados | 🚫 no visible | `events-count: 5` | ✅ SKU | 🔴 | **Spreadsheet dice ilimitados, BD tiene 5.** Corregir BD a 999999 |
| Invitados ilimitados (o más) | 🚫 no visible | `guests-per-event: 200` | ✅ SKU | ⚠️ | ¿Mostrar límite 200? |
| Colaboradores (2) | 🚫 no visible | `max_users: 2` | ❌ no enforced | ⚠️ | ¿Mostrar "hasta 2 colaboradores"? |

**[ ] VERIFICAR EN VIVO:** Crear 6 eventos con BÁSICO — ¿bloquea en el 6º (BD actual=5)?

---

### Sección: Asistente IA

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Consultas IA ~1,000/mes | ✅ "~1000 consultas" | `ai-tokens: 500,000` | ✅ api-ia | 🟢 | OK |
| Límite diario | 🚫 no visible | sin daily_quota | ✅ sin cap | 🟢 | OK — solo FREE tiene daily cap |
| Imágenes IA 50 | ✅ "50 imágenes" | `image-gen: 50` | ✅ quota | 🟢 | OK |
| Copiloto IA | ✅ | ✅ | ✅ | 🟢 | OK |
| Código / Web Browsing | 🚫 | sin SKU | ❌ | 🟡 | ¿Incluir en BÁSICO? |

**[ ] VERIFICAR EN VIVO:** Enviar 51 imágenes IA con BÁSICO — ¿bloquea en 51?

---

### Sección: Comunica y escala

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| WhatsApp | 🚫 no visible | `whatsapp-msg: 200` | ✅ quota | 🔴 | **Spreadsheet dice ❌ (no incluido). BD tiene 200.** Poner a 0 o quitar SKU |
| Email campaña | 🚫 no visible | `email-campaigns: 500` | ✅ quota | ⚠️ | ¿Mostrar? |

**[ ] VERIFICAR EN VIVO:** Intentar enviar WhatsApp con BÁSICO — ¿permite o bloquea?

---

### Sección: Soporte y almacenamiento

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Almacenamiento 5 GB | ✅ "5 GB" en UI | `storage-gb: 10` en script | ✅ quota | 🔴 | **UI muestra 5GB pero script GraphQL dice 10GB.** ¿Cuál es el valor real en BD? Verificar |
| Memories álbumes | 🚫 no en plans | `memories-albums: 3` | ✅ | ⚠️ | |
| Memories fotos | 🚫 no en plans | `memories-photos: 500` | ✅ | ⚠️ | |
| Soporte Comunidad | ✅ | `priority_support: false` | 🖥️ | 🟢 | OK |
| Wallet | ✅ | ✅ | ✅ | 🟢 | OK |
| Descuentos | ✅ ❌ | `global_discount: null` | 🖥️ | 🟢 | OK |
| API acceso | 🚫 no visible (correcto) | `api_access: false` | 🖥️ | 🟢 | OK |
| Créditos mensuales (1,000) | 🚫 no existe | 🚫 sin SKU | ❌ | 🟡 | **DECISIÓN PENDIENTE** |

**[ ] VERIFICAR EN VIVO:** Subir archivos superando 5GB — ¿qué límite aplica realmente?

---

## PLAN PRO (29,99€)

### Sección: Organiza tus eventos

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Eventos ilimitados | 🚫 no visible | `events-count: 20` | ✅ SKU | 🔴 | **Spreadsheet dice ilimitados, BD tiene 20.** Corregir a 999999 |
| Invitados ilimitados | 🚫 no visible | `guests-per-event: 999999` | ✅ → ilimitado | 🟢 | OK, solo falta mostrarlo |
| Colaboradores (5) | 🚫 no visible | `max_users: 5` | ❌ no enforced | ⚠️ | |

---

### Sección: Asistente IA

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Consultas IA "Ilimitadas" | ✅ "Ilimitado" en UI | `ai-tokens: 2,000,000` | ✅ quota muy alta | 🔴 | **UI dice "Ilimitado" pero BD tiene 2M tokens (~4,000 consultas). ¿Cómo se muestra "Ilimitado"? ¿humanize por threshold? Verificar valor real en BD** |
| Límite diario | 🚫 | sin daily_quota | ✅ sin cap | 🟢 | OK |
| Imágenes IA 200 | ✅ "200 imágenes" | `image-gen: 200` | ✅ | 🟢 | OK |
| Copiloto IA | ✅ | ✅ | ✅ | 🟢 | OK |
| Generación de código | 🚫 | sin SKU | ❌ | 🟡 | ¿Debe incluir PRO? |
| Web Browsing | 🚫 | sin SKU | ❌ | 🟡 | ¿Debe incluir PRO? |

**[ ] VERIFICAR EN VIVO:** Enviar 4,001+ consultas con PRO — ¿bloquea o continúa?

---

### Sección: Comunica y escala

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| WhatsApp 1,000 mensajes | ✅ "1000 mensajes" | `whatsapp-msg: 1,000` | ✅ quota | 🟢 | OK |
| Email campaña 5,000 | 🚫 no visible | `email-campaigns: 5,000` | ✅ | ⚠️ | ¿Mostrar en plans? |
| SMS 100 | 🚫 no visible | `sms-invitations: 100` | ✅ | ⚠️ | ¿Mostrar en plans? |

**[ ] VERIFICAR EN VIVO:** Enviar 1,001 WhatsApp con PRO — ¿bloquea?

---

### Sección: Soporte y almacenamiento

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Almacenamiento 20 GB | ✅ "20 GB" | `storage-gb: 20` | ✅ | 🟢 | OK |
| Memories álbumes 20 | 🚫 | `memories-albums: 20` | ✅ | ⚠️ | |
| Memories fotos ilimitadas | 🚫 | `memories-photos: 999999` | ✅ | ⚠️ | |
| Soporte Prioritario | ✅ "Prioritario" | `priority_support: true` | 🖥️ solo UI | 🖥️ | OK marketing |
| Wallet | ✅ | ✅ | ✅ | 🟢 | OK |
| Descuentos 10% | ✅ "10% descuento" | `global_discount: {value:10}` | 🖥️ solo UI | 🔴 | **Mostrado en UI pero ¿se aplica realmente al cobrar?** Verificar en wallet/consumeService |
| API acceso | ✅ mostrado | `api_access: true` | 🖥️ solo UI | 🔴 | **Spreadsheet dice PRO NO tiene API. Decisión: ¿quitar de PRO?** |
| Analytics avanzados | 🚫 no visible | `advanced_analytics: true` | ❌ NUNCA comprobado | ⚠️ | Campo en BD, código no lo usa para nada |
| Gestor dedicado | 🚫 no visible (correcto) | `white_label: false` | 🖥️ | 🟢 | OK |
| Créditos mensuales (4,000) | 🚫 no existe | 🚫 sin SKU | ❌ | 🟡 | **DECISIÓN PENDIENTE** |

**[ ] VERIFICAR EN VIVO:** Confirmar que el 10% descuento se aplica en factura real
**[ ] VERIFICAR EN VIVO:** Llamar a la API con token PRO — ¿se permite o no?

---

## PLAN MAX (79,99€)

### Sección: Organiza tus eventos

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Eventos ilimitados | 🚫 no visible | `events-count: 999999` | ✅ ilimitado | 🟢 | Solo falta mostrarlo |
| Invitados ilimitados | 🚫 no visible | `guests-per-event: 999999` | ✅ | 🟢 | Solo falta mostrarlo |
| Colaboradores ilimitados | 🚫 no visible | `max_users: 999` | ❌ no enforced | ⚠️ | |

---

### Sección: Asistente IA

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Consultas IA "Ilimitadas" | ✅ "Ilimitado" | `ai-tokens: 10,000,000` | ✅ muy alta | 🔴 | Mismo caso que PRO — ¿cómo muestra "Ilimitado"? |
| Imágenes IA 1,000 | ✅ "1000 imágenes" | `image-gen: 999999` | ✅ quota | 🔴 | **UI muestra 1,000 pero BD tiene 999,999 (ilimitado). ¿Ya se actualizó BD? Verificar valor real** |
| Copiloto IA | ✅ | ✅ | ✅ | 🟢 | OK |

**[ ] VERIFICAR EN VIVO:** Intentar generar imagen 1,001 con MAX — ¿bloquea o no?

---

### Sección: Comunica y escala

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| WhatsApp "Ilimitado" | ✅ "Ilimitado" | `whatsapp-msg: 5,000` | ✅ quota | 🔴 | **UI muestra "Ilimitado" pero BD script dice 5,000. ¿Ya actualizado en BD? Verificar** |
| Email campaña 10,000 | 🚫 no visible | `email-campaigns: 10,000` | ✅ | ⚠️ | |
| SMS 1,000 | 🚫 no visible | `sms-invitations: 1,000` | ✅ | ⚠️ | |

**[ ] VERIFICAR EN VIVO:** Enviar 5,001 WhatsApp con MAX — ¿bloquea o continúa (ilimitado)?

---

### Sección: Soporte y almacenamiento

| Funcionalidad | Se muestra en UI | BD actual | ¿Enforced? | Estado | Acción |
|---|---|---|---|---|---|
| Almacenamiento 100 GB | ✅ "100 GB" | `storage-gb: 100` | ✅ | 🟢 | OK |
| Memories ilimitadas | 🚫 no visible | `memories-albums/photos: 999999` | ✅ | 🟢 | |
| Soporte Dedicado | ✅ "Dedicado" | `white_label: true` → Dedicado | 🖥️ | 🖥️ | OK marketing |
| Wallet | ✅ | ✅ | ✅ | 🟢 | OK |
| Descuentos 20% | ✅ "20% descuento" | `global_discount: {value:20}` | 🖥️ | 🔴 | **¿Se aplica realmente al cobrar?** |
| API acceso | ✅ | `api_access: true` | 🖥️ | 🟢 | OK para MAX |
| Analytics avanzados | 🚫 no visible | `advanced_analytics: true` | ❌ NUNCA comprobado | ⚠️ | Sin uso en código |
| Custom integrations | 🚫 no visible | `custom_integrations: true` | ❌ NUNCA comprobado | ⚠️ | Sin uso en código |
| Gestor dedicado | ✅ "Gestor de cuenta" | `white_label: true` | 🖥️ | 🖥️ | OK |
| Branding personalizado | 🚫 no visible | `white_label: true` | ❌ no enforced | ⚠️ | En BD, sin implementar |
| Créditos mensuales (8,000) | 🚫 no existe | 🚫 sin SKU | ❌ | 🟡 | **DECISIÓN PENDIENTE** |

---

## Resumen ejecutivo de discrepancias críticas 🔴

| # | Dónde | Problema | Impacto | Acción |
|---|---|---|---|---|
| 1 | FREE `image-gen` | BD=5, debería ser 0 (spreadsheet ❌) | Usuario FREE puede generar 5 imágenes sin pagar | Corregir BD: poner 0 |
| 2 | BÁSICO `events-count` | BD=5, spreadsheet=ilimitados | Usuario BÁSICO tiene límite de 5 eventos | ¿Corregir BD a 999999? |
| 3 | BÁSICO `whatsapp-msg` | BD=200, spreadsheet=❌ no incluido | Usuario BÁSICO tiene 200 WA que no debería | ¿Quitar SKU de BÁSICO? |
| 4 | BÁSICO `storage-gb` | Script dice 10GB, UI muestra 5GB | ¿Cuál es el valor real en BD? | Verificar BD directamente |
| 5 | PRO `events-count` | BD=20, spreadsheet=ilimitados | Límite de 20 eventos en PRO | ¿Corregir a 999999? |
| 6 | PRO consultas | UI="Ilimitado", BD=2M tokens | ¿Cómo se muestra "Ilimitado" si no es 999999? | Verificar valor real en BD |
| 7 | PRO `api_access` | BD=true, spreadsheet=❌ | Usuario PRO tiene acceso API que no debería | ¿Cambiar BD api_access=false para PRO? |
| 8 | PRO/MAX descuentos | UI muestra 10%/20%, ¿se aplica? | Si no se aplica, es publicidad engañosa | Verificar en consumeService/wallet |
| 9 | MAX `image-gen` | UI=1,000, BD script=999999 | ¿Cuál es el valor real? | Verificar BD directamente |
| 10 | MAX `whatsapp-msg` | UI=Ilimitado, BD script=5,000 | ¿Cuál es el valor real? | Verificar BD directamente |

---

## Funcionalidades en código SIN mostrar al usuario y SIN gatear ⚠️

Estas existen en BD/código pero el cliente nunca las ve ni se bloquean:

| Feature | BD tiene valor | En plans page | Enforced | Decisión |
|---|---|---|---|---|
| `events-count` (todos los planes) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `guests-per-event` (todos) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `email-campaigns` (todos) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `sms-invitations` (PRO/MAX) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `memories-albums` (todos) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `memories-photos` (todos) | ✅ | ❌ | ✅ enforced | ¿Mostrar en UI? |
| `advanced_analytics` (PRO/MAX) | ✅ true | ❌ | ❌ NUNCA usado | ¿Implementar o eliminar? |
| `custom_integrations` (MAX) | ✅ true | ❌ | ❌ NUNCA usado | ¿Implementar o eliminar? |
| `max_users` colaboradores | ✅ 1/2/5/999 | ❌ | ❌ no enforced | ¿Implementar bloqueo? |
| `global_discount` 10%/20% | ✅ PRO/MAX | ✅ UI | 🖥️ solo label | ¿Aplicar en wallet? |
| Generación de código (tool) | herramienta | ❌ | ❌ sin gateo | ¿Qué plan? |
| Web Browsing (tool) | herramienta | ❌ | ❌ sin gateo | ¿Qué plan? |
| Venue Visualizer (tool) | herramienta | ❌ | ❌ sin gateo | ¿Qué plan? |
| Widget visitantes (/widget) | disponible | ❌ | ❌ sin gateo | ¿Qué plan? |
| Web de boda (creator) | disponible | ❌ | ❌ sin gateo | ¿Qué plan? |
| Confirmación RSVP pública | disponible | ❌ | ❌ sin gateo | ¿Todos los planes? |
| Daily cap FREE (5,000 tok/día) | ✅ activo | ❌ no visible | ✅ enforced | ¿Mostrar en plans page? |
| `créditos mensuales` | ❌ sin SKU | ❌ | ❌ | **DECISIÓN DE NEGOCIO** |

---

## Checklist de verificación en producción

### Para ejecutar en chat-test.bodasdehoy.com con cuenta FREE:
- [ ] Crear 2 eventos — ¿bloquea en el 2º?
- [ ] Añadir 51 invitados — ¿bloquea?
- [ ] Intentar generar imagen (FREE=0 objetivo, BD=5 actual) — ¿permite?
- [ ] Enviar ~10 consultas rápidas — ¿daily cap actúa?
- [ ] Enviar ~100 consultas en el mes — ¿bloquea al llegar al límite?
- [ ] Intentar conectar WhatsApp — ¿bloquea?
- [ ] QuotaBanner — ¿aparece cuando está al 80%+?

### Para ejecutar con cuenta BÁSICO:
- [ ] Crear 6 eventos — ¿bloquea en el 6º?
- [ ] Enviar WhatsApp — ¿permite (debería bloquear según spreadsheet)?
- [ ] Confirmar qué GB de almacenamiento aplica (5 o 10)
- [ ] Generar 51 imágenes — ¿bloquea en 51?

### Para ejecutar con cuenta PRO:
- [ ] Enviar >4,000 consultas IA — ¿bloquea o "ilimitado"?
- [ ] Crear >20 eventos — ¿bloquea?
- [ ] Enviar 1,001 WhatsApp — ¿bloquea?
- [ ] Verificar si el 10% descuento se refleja en wallet al consumir
- [ ] Acceder a la API con token PRO — ¿lo permite?

### Para ejecutar con cuenta MAX:
- [ ] Generar 1,001 imágenes — ¿bloquea (BD dice 999999/ilimitado)?
- [ ] Enviar >5,000 WhatsApp — ¿bloquea o es ilimitado?
- [ ] Verificar que 20% descuento se refleja en wallet

---

## Decisiones de negocio pendientes (requieren respuesta)

| # | Pregunta | Opciones |
|---|---|---|
| D1 | ¿Qué son los "créditos mensuales" del spreadsheet? | A) Son los tokens IA renombrados / B) Son una moneda nueva separada / C) Se elimina ese concepto |
| D2 | ¿PRO tiene API acceso o no? | Spreadsheet dice ❌, BD actual dice ✅ |
| D3 | ¿Los descuentos 10%/20% se aplican automáticamente al consumir? | ¿O son solo descuentos en recarga de wallet? |
| D4 | ¿Generación de código y Web Browsing: desde qué plan? | FREE / BÁSICO / PRO / todos |
| D5 | ¿Web de boda (creator): desde qué plan? | FREE / BÁSICO / PRO / todos |
| D6 | ¿Widget visitantes: desde qué plan? | FREE / BÁSICO / PRO / todos |
| D7 | ¿Colaboradores (max_users): se va a gatear técnicamente? | Sí necesita desarrollo / No (solo label marketing) |
| D8 | ¿BÁSICO incluye WhatsApp o no? | Spreadsheet dice ❌, BD actual tiene 200 mensajes |
| D9 | ¿Mostrar límite de emails y SMS en plans page? | Sí / No (invisible pero enforced) |
| D10 | ¿Mostrar límite de álbumes/fotos Memories en plans page? | Sí / No |
