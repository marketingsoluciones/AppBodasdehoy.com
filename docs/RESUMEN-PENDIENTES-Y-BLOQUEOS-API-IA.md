# Resumen: todo lo pendiente y qué nos bloquea api-ia

**Fecha:** 16 feb 2025

---

## 1. Lo que SÍ nos bloquea api-ia (dependemos de ellos)

**503 en POST /webapi/chat/auto**  
Necesitamos que api-ia (y/o API2) corrijan o verifiquen las credenciales whitelabel de bodasdehoy (API key del proveedor de IA). Nosotros no tenemos la key; la resuelve api-ia. Hasta que no avisen "credenciales corregidas", el chat seguirá devolviendo 503.

**Credenciales whitelabel bodasdehoy**  
Cuando API2/api-ia tengan las keys válidas, nos avisan y nosotros ejecutamos test-api-ia-providers.sh y la batería de 20 preguntas.

**Conclusión:** El único bloqueo que depende de api-ia es el 503/credenciales. No podemos desbloquearlo desde el front.

---

## 2. Pendientes nuestros (no nos bloquea api-ia)

- **Sistema de monitoreo de API Keys:** Ya enviamos respuesta corta. Si piden más, enviar RESPUESTA-SLACK-SISTEMA-KEYS.md.
- **Balance de keys en UI:** Decidir sí/no y cómo, y responder en #copilot-api-ia.
- **Notificaciones keys deshabilitadas:** Decidir (Slack, Dashboard, Email) y responder en #copilot-api-ia.

Ninguno nos impide seguir; son respuestas que podemos dar cuando se decida.

---

## 3. Pendientes de otros (no es api-ia)

- **Cloudflare app-test / chat-test:** Frontend (nosotros) tenemos acceso a Cloudflare; configurar Public Hostnames en Zero Trust para que app-test y chat-test carguen sin puerto y permitan login Firebase.

---

## 4. Resumen

- **Nos bloquea api-ia:** solo el 503 del chat (credenciales). Esperamos su aviso.
- **No nos bloquea api-ia:** respuestas sobre Keys (balance, notificaciones).
- **No es api-ia:** Cloudflare lo configuramos nosotros (Frontend).

Refs: docs/PENDIENTES-Y-SLACK-ESTADO.md, TAREAS-PENDIENTES-SLACK.md, docs/PRUEBAS-REALES-PARA-API-IA-FEB2025.md
