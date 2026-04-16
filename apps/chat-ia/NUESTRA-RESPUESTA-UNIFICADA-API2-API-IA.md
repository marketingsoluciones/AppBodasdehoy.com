# Nuestra respuesta unificada (API2 + api-ia) — revisión y pendientes

**Para:** copiar en el canal / correo según convenga (un mensaje o dos hilos: uno API2, otro api-ia).  
**Base:** checklist que envió API2 (bandeja limpia, 4 datos si hay bloqueo, *OK sin bloqueos*, backlog aparte).

---

## Mensaje único (API2 + api-ia en un solo pegado)

```text
[AppBodasdehoy / Chat-IA / LobeChat / Memories → API2 + api-ia]

Revisamos vuestro checklist de estado y alineamos respuesta:

🟢 Cierre integración (vista front / proxy Chat-IA)
- Tras revisión interna: OK, sin bloqueos activos que impidan el uso de GraphQL → API2 ni el flujo de chat/herramientas vía api-ia en nuestros entornos de trabajo.
- Aceptamos el formato acordado: si aparece incidencia, la escalamos en un solo mensaje con (1) endpoint/query (2) UTC (3) contexto/headers, development (4) payload completo.
- Mejoras no bloqueantes (KPIs, E2E extra, UX): las mantenemos como backlog explícito, fuera del hilo de incidencias.

🟡 Coordinación pendiente (no es “bloqueo” salvo error puntual) — para que avancéis conscientes

Con API2:
- WhatsApp (Baileys): hoy el proxy Chat-IA sigue enviando /api/messages/whatsapp/* directo a API2 de forma temporal hasta que api-ia orqueste sesión/conversaciones. Cuando api-ia exponga el equivalente acordado, unificamos todo hacia api-ia y eliminamos ese bypass.
- Facturación/usage: cuando en respuestas 402 (o equivalente) incluyáis URLs de pago/upgrade estables, enlazamos en UI; hasta entonces mostramos mensaje sin URL (como ya acordado).

Con api-ia:
- Misma ventana temporal WhatsApp: necesitamos api-ia con /api/messages/* (conversaciones + sesión Baileys por dev) para cerrar el salto directo a API2 desde el front.
- Widget web / mensajes: donde el proxy aún tenga fallback si api-ia devuelve 404/5xx, queremos confirmación de rutas definitivas y comportamiento en producción.
- Proveedores LLM / streaming: incidencias puntuales las seguimos escalando con el mismo formato de 4 datos; las pruebas por proveedor las llevamos aparte (no mezclar con incidencias API2).

Si necesitáis separar hilos: podemos bifurcar “solo API2” y “solo api-ia” con el mismo contenido en dos mensajes.

— Equipo AppBodasdehoy / Chat-IA
```

---

## Solo API2 (mensaje corto)

```text
[AppBodasdehoy / Chat-IA → API2]
OK, sin bloqueos activos en integración GraphQL y flujos que consumimos desde Chat-IA, según revisión interna.

Pendiente de coordinación (no incidencia): bypass temporal WhatsApp → API2 hasta orquestación api-ia; URLs en 402 cuando estén listas.

Incidencias futuras: un mensaje con los 4 datos acordados.
```

---

## Solo api-ia (mensaje corto)

```text
[AppBodasdehoy / Chat-IA → api-ia]
OK, sin bloqueos activos en chat/proxy en nuestros entornos de trabajo (salvo error puntual que escalaríamos con los 4 datos).

Coordinación para avanzar rápido: cerrar GAP WhatsApp (/api/messages/conversations + sesión) para quitar proxy directo a API2; confirmar endpoints definitivos widget/web donde hoy haya fallback.

Backlog (E2E, UX): aparte del hilo de incidencias.
```

---

## Checklist interno (antes de enviar)

- [ ] ¿Hay un error **activo** con traza? → Enviar **bloqueo** con 4 datos, no este texto.
- [ ] ¿No hay error? → Enviar **OK** + apartado 🟡 solo como **coordinación**, no como ticket rojo.

---

*Relacionado:* `REFERENCIA-CHECKLIST-API2-Y-NUESTRA-RESPUESTA.md`, `ESTADO-PARA-API2-Y-API-IA.md`, `PLANTILLA-COPIAR-PEGAR-API2-Y-API-IA.md`.

