# Respuesta preparada – Sistema de Monitoreo de API Keys (#copilot-api-ia)

**Para:** Canal #copilot-api-ia  
**De:** Frontend / Copilot LobeChat  
**Fecha:** 2026-02-12  

**Envío:** La versión corta por script se envió correctamente a #copilot-api-ia. Para el texto largo (copiar/pegar), usar el bloque siguiente.

---

## Texto para copiar y pegar en Slack

```
Frontend – Respuestas Sistema de Monitoreo de API Keys (api-ia):

1) Notificaciones cuando fallen keys: In-app (toast o banner).
2) Dashboard visual para estado de keys: Sí, se muestra en front.
3) Si dashboard, ¿dónde?: En front / Lobe Chat (donde ya mostramos el estado).
4) Cuando una key falla, qué ve el usuario: Sí, banner o mensaje.
5) Recarga de saldo desde UI: Sí, pero el saldo de su cuenta (usuario). El saldo/recarga de las keys solo lo puede hacer el developer y desde fuera (no desde nuestra UI).
6) Histórico de cambios de estado: Sí, pero solo para el usuario developer; ve el estado de las APIs. También el developer en modo debug en ambos casos.

Balance en UI: Sí, cuando esté disponible (endpoint /monitor/stats).
```

---

## Envío por script (versión corta para límite de caracteres)

Mensaje completo en un solo envío:

```bash
./scripts/slack-send.sh "Frontend - Sistema Keys: 1) In-app toast/banner. 2) Sí en front. 3) En front/Lobe Chat. 4) Banner o mensaje. 5) Saldo cuenta usuario sí; keys solo developer desde fuera. 6) Sí solo developer + debug. Balance UI: sí cuando /monitor/stats."
```

---

## Referencia

- Preguntas originales y contexto: [TAREAS-PENDIENTES-SLACK.md](TAREAS-PENDIENTES-SLACK.md)
- Cómo solucionar lectura del canal: [COMO-SOLUCIONAR-LECTURA-SLACK.md](COMO-SOLUCIONAR-LECTURA-SLACK.md)
