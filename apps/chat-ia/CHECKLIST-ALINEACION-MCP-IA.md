# Alineación API2 / api-ia ↔ AppBodasdehoy (Chat-IA)

**Origen:** mensaje coordinación API2 → Chat-IA / LobeChat / AppBodas / Memories.  
**Objetivo:** cerrar incidencias rápido, bandeja limpia, sin mezclar backlog UX con bloqueos reales.

---

## Cómo respondemos (formato obligatorio si hay error)

Si hay **bloqueo real**, un solo mensaje (Slack/canal acordado) con:

1. **Endpoint o query** exacta
2. **Timestamp UTC**
3. **Headers / contexto** (mínimo `development`, `Authorization` si aplica)
4. **Payload completo** del error (body + respuesta)

Sin esos 4 datos → no se puede cerrar causa raíz; preparad el mensaje antes de escalar.

Si **no hay bloqueo** → responder literalmente **`OK`** y dar el ítem por **cerrado** en la tabla de abajo.

---

## Estado según mensaje API2 (ya cubierto en su lado)

| Ítem | Estado nuestro | Acción |
|------|----------------|--------|
| Incidencias integración que dependían de API2 | **Resueltas** (según ellos; canal) | **CERRADO** salvo ticket abierto con los 4 datos |
| Rutas/headers diagnóstico (`X-Development`, `Authorization`) | **Definidos** | Revisar solo si falla un caso concreto |
| Facturación / usage | **Backend**; no bloquea flujo front “ahora” | **Backlog** (KPIs UI, etc.); no bloqueo integración |

---

## Cierre express (equipo AppBodasdehoy / Chat-IA)

- [ ] **¿Bloqueo real activo?** (algo que impida Copilot o datos) → **SÍ / NO**
- [ ] Si **NO** → enviar **`OK`** al canal según plantilla abajo y vaciar tabla “pendientes bloqueo”.
- [ ] Si **SÍ** → un hilo por error con los **4 datos**.

### Referencia ya implementada en repo (validar en app-test)

- Proxies: `/api/graphql` → **API2**; `/api/backend/*` → **api-ia**; `/api/messages/*` → **api-ia** (WhatsApp temporal → API2 si aplica).
- Tareas: al completar, refetch `/api/events-tasks` (API2 solo devuelve pendientes).

### Backlog (no mezclar con incidencias)

E2E extra, UX, paneles facturación “completos”, KPIs → otro tablero/doc.

---

## Tabla viva — solo **bloqueo real**

| ID | Área | Descripción | ¿Sigue bloqueando? | Cerrado cuando |
|----|------|-------------|-------------------|----------------|
| — | — | *(rellenar solo si hay caso)* | | |

### Cerrados recientes

| ID | Fecha cierre (UTC) | Nota |
|----|-------------------|------|
| INT-API2-2026-03 | *(rellenar)* | Coordinación: sin bloqueo → OK |

---

## Plantilla **OK** (copiar al canal)

```text
[AppBodasdehoy / Chat-IA] Revisión interna:
- Bloqueo activo API2/api-ia: NO
- Estado: OK — cerramos coordinación por nuestra parte.
Backlog no bloqueante: ninguno | [lista corta]
```

## Plantilla **error** (copiar al canal)

```text
[AppBodasdehoy / Chat-IA] Bloqueo activo
1) Endpoint/query: …
2) Timestamp UTC: …
3) Headers: X-Development=…; Authorization=… (si aplica)
4) Payload error completo: …
```

---

*Si usáis `docs/LISTADO-PENDIENTES.md`, copiar ahí solo lo bloqueante o enlazar a este archivo como checklist operativo.*
