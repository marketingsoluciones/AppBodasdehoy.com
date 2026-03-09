# Mejoras aplicadas en api-ia (backend Python)

> Documento generado: 2026-01-29
> Estado: **Todas las mejoras desplegadas en produccion**
> Backend: `api-ia.bodasdehoy.com` — FastAPI + Groq (llama-3.3-70b-versatile)
> Principio arquitectonico: toda la logica de IA, razonamiento, MCP y function calling vive en el backend. El frontend solo muestra la informacion. Las peticiones pueden venir de multiples canales (web, mobile, API directa), no solo del chat web.

---

## 1. Groq registrado como provider con function calling

**Estado: COMPLETADO**

Groq agregado al diccionario `self.providers` de `SmartAutoRouter` en `core/auto_routing_unified.py` con capabilities: FUNCTION_CALLING, DATA_ACCESS, FAST_RESPONSE, LOW_COST. El smart router ahora selecciona Groq como provider principal.

---

## 2. Orchestrator reconoce Groq como fc_provider

**Estado: COMPLETADO**

`"groq"` agregado al bloque OpenAI en el mapping de `fc_provider` en `core/orchestrator.py`. Groq usa API OpenAI-compatible con `base_url = https://api.groq.com/openai/v1`.

---

## 3. Fechas formateadas correctamente

**Estado: COMPLETADO**

Funcion `format_fecha()` implementada en `tools/events_tools.py`. Convierte timestamps Unix (ms) y strings ISO a formato `dd/mm/yyyy`. Aplicado en `execute_get_user_events` y `execute_get_event_details`.

---

## 4. Filtro de eventos futuros

**Estado: COMPLETADO**

Parametro `filter_future_only` agregado a la tool `get_user_events`. Cuando el LLM detecta que el usuario pide eventos "proximos", "futuros", etc., activa este filtro y solo devuelve eventos con fecha posterior a hoy.

---

## 5. Blacklist corregida para no bloquear Groq

**Estado: COMPLETADO**

La blacklist en `rest_chat_handler.py` ya no matchea `"llama"` contra modelos de Groq. Se verifica por provider (no por nombre de modelo), o se usa whitelist de providers con function calling.

---

## 6. System prompt incluye fecha/hora actual

**Estado: COMPLETADO**

El system prompt ahora inyecta la fecha actual, ano actual, ano proximo y ano pasado para que el LLM interprete correctamente expresiones temporales.

---

## 7. Insercion de invitados funciona

**Estado: COMPLETADO**

Resuelto como consecuencia de #1 y #2. Groq ejecuta function calling con `add_guest` correctamente via API OpenAI-compatible.

---

## 8. Formato de respuestas mejorado

**Estado: COMPLETADO**

Instrucciones de formato agregadas al system prompt: markdown, listas numeradas, fechas dd/mm/yyyy, montos con separador de miles, links de navegacion.

---

## 9. Mutation de add_guest verificada

**Estado: COMPLETADO**

Verificado que `agregarInvitado` en API2 (`api2.eventosorganizador.com/graphql`) es la mutation correcta para el backend.

---

## 10. Keywords de action detection ampliadas

**Estado: COMPLETADO**

Lista `keywords_function_calling` en `rest_chat_handler.py` ampliada con verbos de accion: agregar, crear, eliminar, modificar, cambiar, actualizar, registrar, etc.

---

## Resumen

| # | Impacto | Estado |  Descripcion |
|---|---------|--------|-------------|
| 1 | CRITICO | HECHO | Groq registrado como provider en auto_routing_unified.py |
| 2 | CRITICO | HECHO | Groq reconocido como fc_provider en orchestrator.py |
| 5 | CRITICO | HECHO | Blacklist corregida para Groq |
| 7 | CRITICO | HECHO | Insercion de invitados funciona (consecuencia de #1 y #2) |
| 3 | ALTO | HECHO | Fechas formateadas (timestamps → dd/mm/yyyy) |
| 10 | ALTO | HECHO | Keywords de action detection ampliadas |
| 6 | MEDIO | HECHO | Fecha actual inyectada en system prompt |
| 4 | MEDIO | HECHO | Filtro de eventos futuros implementado |
| 8 | MEDIO | HECHO | Instrucciones de formato en system prompt |
| 9 | BAJO | HECHO | Mutation agregarInvitado verificada |

Todos los cambios estan en produccion en `api-ia.bodasdehoy.com`.
