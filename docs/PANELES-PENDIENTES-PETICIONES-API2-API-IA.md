# Paneles pendientes: análisis y peticiones a API2 / api-ia

Documento para **avanzar** en los paneles que nos faltan: qué podemos hacer nosotros ya, qué necesitamos que expongan los equipos de API2 y api-ia, y texto listo para pedir ayuda.

**Referencia:** `docs/NUESTRA-PARTE-PENDIENTE-E-IMPLEMENTADO.md` (paneles 1–8).

---

## Resumen por panel

| # | Panel | Podemos hacer ya (front) | Necesitamos (API2 / api-ia) | A quién pedir |
|---|--------|---------------------------|-----------------------------|----------------|
| 1 | Catálogo de planes | UI y ruta con datos mock o vacíos | Query `getAvailablePlans` (o equivalente): listado de planes con nombre, tier, precio, límites | **API2** |
| 2 | Cambiar de plan | Botón "Cambiar plan" y flujo en UI | Mutation/flujo para cambiar suscripción (plan_id) + URL Stripe o session_id para checkout | **API2** |
| 3 | Recargar servicio específico | Opcional: selector "Recargar solo IA / solo SMS" en UI | Si existe: SKUs por servicio y sesión de recarga por SKU; si no, dejamos recarga global | **API2** |
| 4 | Multinivel: saldo niveles inferiores | Nada sin datos | Query jerarquía (padre/hijos) y saldo por subcuenta o agregado | **API2** |
| 5 | Saldo revendedor | Nada sin datos | Modelo revendedor y endpoints para saldo revendedor / asignado | **API2** |
| 6 | Dar crédito (admin) | Pantalla admin con formulario (usuario + cantidad) | Mutation `wallet_credit` o `wallet_adjust` (user_id, amount, motivo) expuesta para admin | **API2** |
| 7 | Balance de keys (api-ia) en UI | Pantalla que llame a un endpoint nuestro o directo | Endpoint lectura: balance/cuota de keys por development (ej. GET /monitor/stats o en API2) | **api-ia** o **API2** |
| 8 | Notificaciones keys deshabilitadas | Config en UI si nos dan opciones | Decisión: Slack / Email / Dashboard; y si hay API para suscribirse o es solo interno | **api-ia** + producto |

---

## 1. Catálogo de planes

- **Qué tenemos:** En Copilot solo mostramos el **plan actual** del usuario (`getUserSubscription` → plan_name, plan_tier, limits). No hay listado de “todos los planes disponibles”.
- **Qué podemos hacer ya:** Crear la ruta y la pantalla “Planes” en Facturación con lista vacía o con 2–3 planes mock (nombre, precio, límites) y el texto “Próximamente cuando API2 exponga el catálogo”.
- **Qué pedir a API2:**
  - Una query tipo **`getAvailablePlans`** (o nombre que usen) que devuelva:
    - Listado de planes ofrecidos (id, nombre, tier, precio mensual, límites por servicio, características).
  - Si ya existe con otro nombre o en otro servicio, que nos indiquen nombre y contrato (GraphQL o REST).

**Texto para pedir ayuda (Slack / doc para API2):**

> Hola, para la pantalla **Catálogo de planes** en el Copilot (Facturación) necesitamos un listado de planes disponibles con precios y límites. ¿Existe ya una query tipo `getAvailablePlans` (o equivalente) en API2? Si no, ¿podrían exponerla? Necesitamos: id/nombre del plan, tier, precio, límites (tokens IA, imágenes, etc.) y características visibles. Gracias.

---

## 2. Cambiar de plan (upgrade / downgrade)

- **Qué tenemos:** Mostramos el plan actual y el próximo cobro. No hay flujo “Cambiar plan”.
- **Qué podemos hacer ya:** Añadir en “Mi Plan” un botón “Cambiar plan” que lleve a la futura pantalla de planes; cuando exista la API, conectar con la URL o sesión de checkout que nos den.
- **Qué pedir a API2:**
  - Flujo para **cambiar de plan** (cambio de suscripción):
    - Opción A: mutation que reciba `plan_id` y devuelva una **URL de checkout de Stripe** (o session_id) para completar el cambio.
    - Opción B: endpoint que devuelva la URL directamente para el plan deseado.
  - Definir si el cambio es inmediato o al final del periodo, y si hay período de gracia.

**Texto para pedir ayuda:**

> Para el flujo **Cambiar plan** (upgrade/downgrade) en el Copilot necesitamos poder iniciar el cambio de suscripción desde la UI. ¿Pueden exponer una mutation o endpoint que, dado un `plan_id` (o identificador del plan destino), devuelva una URL de checkout (Stripe) para que el usuario complete el cambio? Indicad también si el cambio es inmediato o al final del periodo actual.

---

## 3. Recargar un servicio específico

- **Qué tenemos:** Recarga de **saldo global** (wallet) con `CreateRechargeSession`; el usuario elige cantidad en euros.
- **Qué podemos hacer ya:** Opcional: en el modal de recarga, un selector “Recargar solo para: IA / SMS / Todo” que por ahora solo afecte a la etiqueta; cuando haya SKUs, enviaríamos el SKU en la petición si la API lo soporta.
- **Qué pedir a API2:**
  - ¿Existen **SKUs por servicio** (IA, SMS, etc.) y se puede crear una sesión de recarga asociada a un SKU concreto? Si sí, contrato (parámetros y respuesta). Si no, dejamos solo recarga global.

**Texto para pedir ayuda:**

> Para mejorar la UX de recarga nos gustaría ofrecer “Recargar solo para IA” o “solo SMS” si tiene sentido en el modelo de negocio. ¿La API de wallet/recarga soporta hoy (o podría soportar) recarga asociada a un servicio/SKU concreto, o la recarga es siempre global? Si es por SKU, necesitamos el contrato para integrarlo.

---

## 4. Multinivel: saldo niveles inferiores

- **Qué tenemos:** Solo saldo y transacciones del usuario actual. No hay concepto de jerarquía ni subcuentas.
- **Qué podemos hacer ya:** Nada útil sin datos de jerarquía y saldo por hijo.
- **Qué pedir a API2:**
  - Modelo de **jerarquía** (cuenta padre / cuentas hijas o niveles).
  - Query(ies) para:
    - Listar cuentas hijas (o niveles inferiores) del usuario actual.
    - Obtener **saldo agregado** o saldo por subcuenta (por hijo/nivel).
  - Si esto no está en el roadmap a corto plazo, que nos lo comuniquen para no bloquear la UI.

**Texto para pedir ayuda:**

> Estamos valorando una pantalla de **multinivel** (ver saldo de niveles inferiores / subcuentas). ¿API2 tiene o tendrá modelo de jerarquía (padre/hijos) y alguna query para listar subcuentas y su saldo (o saldo agregado)? Si no está previsto, agradeceríamos que nos lo indiquen para priorizar otras pantallas.

---

## 5. Saldo revendedor

- **Qué tenemos:** Nada relacionado con revendedor.
- **Qué podemos hacer ya:** Nada sin modelo ni datos.
- **Qué pedir a API2:**
  - Si existe el concepto **revendedor**: endpoints o queries para saldo revendedor y, si aplica, saldo asignado a cuentas hijas.
  - Si no existe, confirmación para no implementar esta pantalla de momento.

**Texto para pedir ayuda:**

> Para una posible pantalla de **saldo revendedor** (y saldo asignado a cuentas hijas): ¿está definido en API2 el modelo de revendedor y hay (o habrá) endpoints para consultar ese saldo? Si no, ¿podéis confirmarnos que no está en scope a corto plazo?

---

## 6. Dar crédito (admin)

- **Qué tenemos:** En admin tenemos billing por costes (proveedores, canales, almacenamiento). No hay pantalla “Dar crédito a usuario”.
- **Qué podemos hacer ya:** Crear la **pantalla de admin** (ruta + formulario: usuario, cantidad, motivo opcional) que llame a una mutation cuando exista. Mientras no exista la mutation, el botón puede mostrar “No disponible: pendiente de API2”.
- **Qué pedir a API2:**
  - Mutation (o endpoint) **`wallet_credit`** o **`wallet_adjust`** para uso **admin**:
    - Parámetros: identificador de usuario (user_id o email), cantidad, motivo/notas opcional.
    - Respuesta: éxito/error, nuevo saldo si aplica.
  - Requisitos de permisos (rol admin, scope) para poder llamarla.

**Texto para pedir ayuda:**

> Necesitamos una **mutation de admin** para dar crédito a un usuario (ajuste manual de wallet). Algo tipo `wallet_credit` o `wallet_adjust` con: user_id (o email), cantidad, motivo opcional. ¿Existe ya en API2 o podrían exponerla para uso solo admin? Necesitamos el contrato (GraphQL o REST) y los requisitos de autorización (rol/scope).

---

## 7. Balance de keys (api-ia) en UI

- **Qué tenemos:** Nada. La decisión de mostrar balance de keys en el Copilot está recogida en docs (RESPUESTA-SLACK-SISTEMA-KEYS.md).
- **Qué podemos hacer ya:** Dejar preparada una pantalla o sección “Saldo / uso de keys IA” que consuma un endpoint; mientras no exista, mostrar “Próximamente” o mensaje que indique que api-ia/API2 lo expondrán.
- **Qué pedir a api-ia / API2:**
  - Un **endpoint de solo lectura** para el balance o uso de keys por development (por ejemplo GET `/monitor/stats` o equivalente en API2), con autenticación (JWT o API key de app). Respuesta: por ejemplo saldo restante, límite, uso del periodo.

**Texto para pedir ayuda (api-ia o API2):**

> Queremos mostrar en el Copilot el **balance/cuota de keys de IA** (por development). ¿Pueden exponer un endpoint de lectura (por ejemplo en api-ia o en API2) que devuelva saldo restante, límite y/o uso del periodo, con autenticación (JWT)? Cuando esté disponible nos avisáis por #copilot-api-ia y conectamos la UI.

---

## 8. Notificaciones keys deshabilitadas

- **Qué tenemos:** Sin decisión ni UI.
- **Qué podemos hacer ya:** Si api-ia/producto definen opciones (Slack, Email, Dashboard), podemos añadir en Ajustes del Copilot una sección “Alertas” para elegir canal (cuando exista backend para guardar preferencia). Mientras tanto, nada.
- **Qué pedir a api-ia / producto:**
  - Decisión: qué canales se ofrecen (Slack, email, aviso en dashboard).
  - Si hay API o configuración para que el usuario (o el development) elija cómo recibir el aviso cuando las keys se deshabiliten.

**Texto para pedir ayuda:**

> Para **notificaciones de keys deshabilitadas**: ¿está definido cómo se notifica al usuario/development (Slack, email, aviso en dashboard)? Si hay opción configurable, ¿existe o existirá API o pantalla de preferencias para elegir el canal? Nosotros podemos añadir la UI de preferencias en el Copilot cuando el backend esté definido.

---

## Cómo usar este documento

1. **Copiar los “Texto para pedir ayuda”** en Slack (#copilot-api-ia o canal de API2) o en un doc compartido con los equipos.
2. **Priorizar** con producto qué paneles son must-have (ej. catálogo + cambiar plan, dar crédito admin) para que API2/api-ia prioricen sus respuestas.
3. **Nosotros:** Implementar lo que no dependa de API (ver siguiente sección).

---

## Lo que hemos implementado ya (placeholders)

| Panel | Implementado |
|-------|--------------|
| **Catálogo de planes** | Ruta `/settings/billing/planes`: página “Planes” con mensaje y 3 cards mock (Básico, Pro, Max). Enlace “Ver planes” cuando no hay suscripción. |
| **Cambiar de plan** | En “Mi Plan” (Facturación) botón “Cambiar plan” → `/settings/billing/planes`. Sin suscripción: “Ver planes”. |
| **Dar crédito (admin)** | Ruta `/admin/billing/dar-credito`: formulario (usuario, cantidad, motivo) y botón “Dar crédito (pendiente de API2)” deshabilitado. Enlace desde admin Facturación. |
| **Balance de keys** | En Facturación (Copilot) sección “Uso de keys IA” con texto “Próximamente” y tag. |

Cuando API2/api-ia expongan los endpoints, solo hay que conectar estas pantallas a la API.
