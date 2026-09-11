# Estado para API2 y api-ia (consciencia rápida / cerrar o avanzar)

**Para:** equipos API2 y api-ia. **Desde:** AppBodasdehoy / Chat-IA.

Objetivo: que veáis de un vistazo **qué no bloquea**, **qué falta** y **qué mensaje enviar** para cerrar o desbloquear sin idas y vueltas.

---

## Leyenda

| Marca | Significado |
|--------|-------------|
| **NO PENDIENTE** | No requiere acción vuestra o ya está cubierto en front/proxy según acuerdo |
| **PENDIENTE NUESTRO** | Lo hace AppBodas / Chat-IA |
| **PENDIENTE VUESTRO** | Necesitamos cambio o dato en backend (API2 / api-ia) |
| **CERRADO** | Dar por cerrado el hilo si no hay error activo |

---

## Hacia API2 (Mongo / GraphQL / negocio)

### NO PENDIENTE (referencia; no os pedimos nada si no hay ticket)

- Integración GraphQL desde Copilot vía proxy `POST /api/graphql` → API2 (headers que propagamos: `Authorization`, `Developer`, `SupportKey`, `Origin` según caso).
- Tareas de evento: completar tarea → mutation `editTask` …; listado solo pendientes vía `getAllUserRelatedEventsByEmail` en `/api/events-tasks`.
- Facturación / usage en backend: el front no bloquea el flujo principal mientras no haya incidencia abierta.

### PENDIENTE VUESTRO (solo si lo tenéis en roadmap)

- Si devolvéis **402** con `payment_url` / `upgrade_url`: el front puede enlazar “Recargar”; hasta entonces mostramos mensaje sin URL (comportamiento acordado).

### PENDIENTE NUESTRO

- Confirmar internamente **OK** o cada error con los 4 datos (endpoint/query, UTC, headers/development, payload).
- Mantener proxies y variables `GRAPHQL_ENDPOINT` / soporte alineados por entorno.

### Mensaje recomendado **→ API2** (copiar/pegar)

**Si todo OK por nuestra parte (cerrar coordinación):**
```text
[Chat-IA / AppBodas → API2] Estado: NO PENDIENTE bloqueante desde front.
- GraphQL y flujos que usamos: operativos en nuestro entorno de prueba.
- Si tenéis ticket abierto sin repro: cerramos por nuestra parte salvo que indiquéis lo contrario.
```

**Si hay bloqueo real:**
```text
[Chat-IA / AppBodas → API2] BLOQUEO
1) Query/mutation y URL: …
2) UTC: …
3) development + headers relevantes: …
4) Respuesta/payload error completo: …
```

---

## Hacia api-ia (orquestación IA / chat / tools)

### NO PENDIENTE (referencia)

- Chat y streaming: front llama a proxy que reenvía a **api-ia** (`/api/backend/*`, `webapi/chat/*` según configuración).
- Mensajería unificada objetivo: `/api/messages/*` → api-ia (salvo transición WhatsApp→API2 si aún aplica).
- RAG / KB según diseño acordado: sin fallbacks silenciosos raros; error visible si middleware/API no disponible.

### PENDIENTE VUESTRO (típico)

- Cualquier **NO_PROVIDERS_AVAILABLE** / routing de modelos en streaming que dependa de lógica servidor.
- Keys/ cuotas / 402 coordinadas con política servidor.
- Cuando api-ia orqueste Baileys/WhatsApp completo: podremos quitar proxy directo a API2 solo para ese canal.

### PENDIENTE NUESTRO

- Probar cada proveedor LLM que usemos y enviar **OK** o error con los 4 datos.
- Textos de verificación: `apps/chat-ia/TEXTOS-VERIFICACION-POR-PROVEEDOR.md`.
- Checklist alineación: `apps/chat-ia/CHECKLIST-ALINEACION-API2-API-IA.md`.

### Mensaje recomendado **→ api-ia** (copiar/pegar)

**Si todo OK (cerrar o no abrir ticket):**
```text
[Chat-IA / AppBodas → api-ia] Estado: NO PENDIENTE bloqueante.
- Chat + proveedor(es) que usamos en producción/test: OK en nuestras pruebas.
- No escalamos incidencia hasta nuevo fallo documentado con los 4 datos.
```

**Si hay bloqueo (un mensaje, un problema):**
```text
[Chat-IA / AppBodas → api-ia] BLOQUEO
1) Endpoint/ruta o operación: …
2) UTC: …
3) X-Development / usuario / provider_id / modelo: …
4) Cuerpo error + trace_id: …
```

**Si necesitáis que avancemos algo de nuestro lado (claro para vosotros):**
```text
[Chat-IA / AppBodas → api-ia] Solicitud concreta
- Qué necesitáis que haga el front: …
- Plazo si aplica: …
- Contrato esperado (ejemplo JSON o curl): …
```

---

## Una frase para que avancéis rápido

- **API2:** “Front en **NO PENDIENTE** salvo error con 4 datos; si no hay error, **cerramos**.”
- **api-ia:** “Front en **NO PENDIENTE** salvo error con 4 datos; proveedores probados según lista interna; **cerramos** hilos sin repro.”

Actualizar este archivo cuando cambie un acuerdo (URLs, WhatsApp, 402, RAG).

