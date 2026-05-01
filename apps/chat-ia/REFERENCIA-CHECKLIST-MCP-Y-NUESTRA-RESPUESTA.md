# Referencia: checklist API2 + cómo respondemos nosotros

**Objetivo:** un solo sitio con el texto que envía **API2** y el **espejo** que envía AppBodas/Chat-IA para mantener la misma lógica de bandeja limpia.

---

## Texto recibido de API2 (referencia oficial)

Checklist corto de estado — **API2 → AppBodasdehoy / Chat-IA / LobeChat / Memories**

```text
🔵 [API2 → AppBodasdehoy / Chat-IA / LobeChat / Memories]
Checklist de estado para mantener bandeja limpia:

✅ Lo ya cubierto por API2
- Integración y coordinación respondidas por canal.
- Header/contexto técnico definido (X-Development + Authorization).
- Facturación/usage en seguimiento backend (sin acción front ahora).

🟡 Lo que necesitamos de vuestro lado (solo si hay bloqueo real)
Si hay error activo, enviad en un único mensaje:
1) endpoint/query exacta
2) timestamp UTC
3) contexto/headers (al menos development)
4) payload completo del error

🟢 Cierre
- Si no hay bloqueo: responded "OK, sin bloqueos".
- Si hay mejoras no bloqueantes (KPIs, E2E, UX), separarlas como backlog (no incidencia).

Con ese formato cerramos rápido y sin ruido.
```


---

## Nuestra respuesta espejo (copiar/pegar cuando toque)

### Si **no hay bloqueo** (cierre)

```text
🟢 [AppBodasdehoy / Chat-IA / LobeChat / Memories → API2]
OK, sin bloqueos.
- Revisión interna: sin error activo que impida integración GraphQL / flujos acordados.
- Mejoras no bloqueantes (si las hay): las llevamos por backlog aparte, no como incidencia.

Cerramos por nuestra parte salvo que indiquéis seguimiento puntual.
```

### Si **hay bloqueo real** (un solo mensaje)

```text
🔴 [AppBodasdehoy / Chat-IA → API2] Bloqueo activo

1) endpoint/query exacta: _________________________________
2) timestamp UTC: _________________________________________
3) contexto/headers (development + demás relevantes): _____
4) payload completo del error: _____________________________
```

---

## Relación con otros archivos del repo

| Documento | Para qué |
|-----------|----------|
| **Este archivo** | Texto API2 guardado + respuestas OK / bloqueo alineadas |
| `PLANTILLA-COPIAR-PEGAR-API2-Y-API-IA.md` | Pedidos concretos: resolver / confirmar / responder |
| `ESTADO-PARA-API2-Y-API-IA.md` | Estado amplio API2 + api-ia |
| `TEXTOS-VERIFICACION-POR-PROVEEDOR.md` | Solo verificación LLM (no mezclar con incidencias API2) |

