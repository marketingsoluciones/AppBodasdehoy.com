# Plantilla copiar / pegar — mensajes a API2 y api-ia

**Uso:** copia el bloque que corresponda (API2 o api-ia), rellena las líneas con `___` o los corchetes, y pégalo en Slack/correo.  
**Alcance:** coordinación e incidencias; **no** incluye aquí la batería de pruebas por proveedor LLM (eso va aparte, `TEXTOS-VERIFICACION-POR-PROVEEDOR.md`).

---

## Para API2 (copiar desde la línea siguiente hasta el final del bloque `text`)

```text
[AppBodasdehoy / Chat-IA → API2] — Pedido y confirmaciones

1) Necesitamos que resolváis:
   - _________________________________________________
   - _________________________________________________

2) Necesitamos confirmación sobre:
   - _________________________________________________
   - _________________________________________________

3) Queremos que nos respondáis sobre:
   - _________________________________________________

4) Prioridad: [ baja | media | alta ]   Plazo deseado: _______________

Recordatorio / alcance: excluido de este mensaje lo relativo a
[ tests masivos de proveedores LLM | E2E completa | ___ ];
solo lo indicado en los puntos 1–3.

Gracias — equipo Chat-IA / AppBodas
```

---

## Para api-ia (copiar desde la línea siguiente hasta el final del bloque `text`)

```text
[AppBodasdehoy / Chat-IA → api-ia] — Pedido y confirmaciones

1) Necesitamos que resolváis:
   - _________________________________________________
   - _________________________________________________

2) Necesitamos confirmación sobre:
   - _________________________________________________
   - _________________________________________________

3) Queremos que nos respondáis sobre:
   - _________________________________________________

4) Prioridad: [ baja | media | alta ]   Plazo deseado: _______________

Recordatorio / alcance: excluido de este mensaje lo relativo a
[ tests masivos de proveedores LLM | E2E completa | ___ ];
solo lo indicado en los puntos 1–3.

Gracias — equipo Chat-IA / AppBodas
```

---

## Ejemplo relleno (API2) — solo referencia; no copiar tal cual si no aplica

```text
[AppBodasdehoy / Chat-IA → API2] — Pedido y confirmaciones

1) Necesitamos que resolváis:
   - Inconsistencia en respuesta de getWhiteLabelConfig para development=X cuando …
   - Timeout intermitente en mutación editTask para eventos con muchos itinerarios

2) Necesitamos confirmación sobre:
   - Fecha estimada de payment_url en respuesta 402
   - Si el header SupportKey que enviamos desde el proxy es el esperado en pre

3) Queremos que nos respondáis sobre:
   - Si el comportamiento Z es bug o contrato definitivo

4) Prioridad: media   Plazo deseado: esta semana

Recordatorio / alcance: excluido de este mensaje lo relativo a
tests masivos de proveedores LLM y E2E completa;
solo lo indicado en los puntos 1–3.

Gracias — equipo Chat-IA / AppBodas
```

---

## Dónde vive cada cosa (para no mezclar)

| Qué queréis enviar | Archivo |
|--------------------|---------|
| Este recordatorio (resolver / confirmar / responder) | **Este archivo** |
| Verificación LLM proveedor por proveedor | `TEXTOS-VERIFICACION-POR-PROVEEDOR.md` |
| Estado general y “OK / no pendiente” | `ESTADO-PARA-API2-Y-API-IA.md` |

