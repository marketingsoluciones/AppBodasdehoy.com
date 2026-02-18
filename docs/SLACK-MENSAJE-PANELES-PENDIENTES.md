# Mensaje para Slack #copilot-api-ia – Paneles pendientes (Frontend)

Copia y pega el bloque siguiente en #copilot-api-ia (o adapta si lo envías por otro canal / a API2).

---

**Mensaje:**

```
Hola,

Desde Frontend hemos dejado listas las pantallas/placeholders de Facturación que no dependen de API: catálogo de planes, botón "Cambiar plan", sección "Uso de keys IA", y admin "Dar crédito". Para poder conectarlas con datos reales necesitamos lo siguiente:

**Para API2:**
1. **Catálogo de planes:** query tipo getAvailablePlans (listado planes + precios + límites).
2. **Cambiar plan:** mutation o endpoint que, dado plan_id, devuelva URL de checkout Stripe para cambiar suscripción.
3. **Recarga por servicio:** ¿existe recarga por SKU/servicio (IA, SMS) o solo recarga global?
4. **Multinivel:** ¿hay o habrá jerarquía padre/hijos y query de saldo por subcuenta?
5. **Saldo revendedor:** ¿está en scope? Si sí, endpoints para consultar ese saldo.
6. **Dar crédito (admin):** mutation wallet_credit o wallet_adjust (user_id, cantidad, motivo) para uso admin.

**Para api-ia / API2:**
7. **Balance de keys IA:** endpoint de lectura (balance/cuota por development) para mostrarlo en Copilot cuando esté disponible.
8. **Notificaciones keys deshabilitadas:** decisión de canales (Slack/Email/Dashboard) y si hay API de preferencias.

Detalle y textos listos para cada punto: repo Frontend, docs/PANELES-PENDIENTES-PETICIONES-API2-API-IA.md.

Gracias.
```

---

**Cuándo enviar:** Cuando quieras coordinar con API2 y api-ia; el doc tiene también los textos concretos por panel por si prefieren que se les envíe por otro medio.

**Enviado:** Sí, mensaje enviado a #copilot-api-ia (slack-send.sh --copilot). Quien coordina (api-ia/API2) puede responder en el mismo canal.
