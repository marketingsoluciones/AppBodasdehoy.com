# Soluciones: chat-test, app-test y api-ia

Resumen de **qué hacer** para cada problema y **quién** puede solucionarlo.

---

## Qué es qué (para no liarse)

- **app-test** = El **sitio** que conoces: `https://app-test.bodasdehoy.com`. Es la app de bodas/eventos (invitados, presupuesto, mesas, etc.). Cuando decimos “app-test no carga” nos referimos a ese sitio.
- **chat-test** = El **sitio** del chat/Copilot: `https://chat-test.bodasdehoy.com`. Es la interfaz de la IA.
- **Servidor de app-test** = La máquina o plataforma donde está desplegada la aplicación que se ve en app-test. Ahí corre un proceso (Node/Next.js) que sirve las páginas. Si ese proceso está caído o mal configurado, app-test devuelve 502.

*(En el código del repo, la aplicación de app-test está en la carpeta `apps/appEventos`. Solo importa si tienes que hacer build o buscar archivos; para hablar del sitio usamos siempre “app-test”.)*

---

## 1. app-test no carga (502 Bad Gateway)

### Qué significa
Cloudflare responde, pero el **servidor donde está desplegado app-test** no responde o está caído (el proceso que sirve las páginas no está arriba o no contesta).

### Soluciones (por orden de probabilidad)

| Acción | Quién | Cómo |
|--------|-------|------|
| **Arrancar o reiniciar el proceso** que sirve app-test | Infra / DevOps | En el servidor donde está app-test: reiniciar el proceso (pm2, systemctl o el comando que use vuestro despliegue). |
| **Comprobar que el puerto** (p. ej. 3000) está escuchando | Infra | Si no hay proceso escuchando, el arranque falló o el proceso murió. Revisar con `netstat` o similar. |
| **Revisar logs** del servidor / plataforma (Vercel, VPS, etc.) | Infra / Dev | Buscar crash, falta de memoria, error de arranque. Corregir causa (memoria, variable de entorno faltante, dependencia). |
| **Revisar Cloudflare** | Infra | En app-test.bodasdehoy.com: que **Origin Server** apunte al host y puerto correctos donde corre la app. |
| **Volver a desplegar** app-test | Dev / CI | Asegurar que el último build se ha desplegado en el entorno de app-test (en el repo el build es `pnpm build:web` en la app de eventos). |

**Resumen:** Es un problema de **infraestructura/despliegue**. Hay que asegurar que el proceso que sirve app-test está arriba y que Cloudflare apunta al origin correcto.

---

## 2. chat-test no carga (500 Internal Server Error)

### Qué significa
El servidor de chat-test **sí responde**, pero al servir la página (o una ruta/API) ocurre un error y devuelve 500.

### Soluciones (por orden de probabilidad)

| Acción | Quién | Cómo |
|--------|-------|------|
| **Revisar logs del servidor** donde corre chat-ia (Next.js) | Infra / Dev | Al reproducir el 500 (GET a la raíz o a la ruta que reescribe el middleware), en los logs debe aparecer el **stack trace** o el mensaje de error. Eso indica la causa (excepción en código, fallo de API, etc.). |
| **Revisar variables de entorno** del despliegue de chat-test | Infra / Dev | Falta de `NEXT_PUBLIC_*`, URL de api-ia, api2, auth, etc., puede provocar fallo al renderizar o al llamar a un backend. Añadir o corregir las que falten. |
| **Reproducir en local** | Dev | `pnpm dev` en chat-ia con las mismas env que usa chat-test. Si en local también da 500, el stack trace en consola indica el archivo y la línea. |
| **Comprobar dependencias externas** | Dev | Si la página o el middleware llama a api-ia, api2 o auth y uno falla, puede acabar en 500. Revisar que esas URLs/env estén bien y que los servicios respondan. |
| **Añadir página de error 500** (opcional) | Dev | Crear `apps/chat-ia/src/app/500.tsx` o `global-error.tsx` para mostrar un mensaje más amigable; no quita la causa del 500 pero mejora la experiencia. |

**Resumen:** Es un **error en el servidor** (código o configuración). Los logs del proceso Next.js de chat-test son la primera pista.

---

## 3. api-ia devuelve 503 (timeout) en algunas preguntas

### Qué significa
La petición a `POST /webapi/chat/auto` tarda más de lo que api-ia permite (~25 s) y responde con 503 y `error_code: "TIMEOUT_ERROR"`.

### Soluciones (del lado de api-ia / backend IA)

| Acción | Quién | Cómo |
|--------|-------|------|
| **Subir el timeout** en el backend de api-ia para consultas que requieren más tiempo (p. ej. invitados, resúmenes) | Equipo api-ia | Ajustar el límite (p. ej. 25 s → 40 s) o hacerlo configurable por tipo de consulta. |
| **Optimizar el modelo o la consulta** (menos tokens, cache, etc.) | Equipo api-ia | Reducir latencia para que la respuesta llegue dentro del timeout actual. |
| **Devolver respuesta parcial** antes del timeout | Equipo api-ia | Si se acerca el límite, responder con lo que se tenga y un aviso de “respuesta incompleta” en lugar de 503. |

### Qué puedes hacer desde el repo (frontend)

| Acción | Dónde | Cómo |
|--------|-------|------|
| **Mostrar bien el 503** al usuario | chat-ia | Ya se puede reenviar `detail` y `screen_type` en 402/503; asegurar que el modal o mensaje muestre la sugerencia de api-ia (p. ej. “Intenta con una pregunta más corta”). |
| **Dar evidencia a api-ia** | Scripts | Ejecutar `node scripts/ejecutar-pruebas-reales-todas.mjs` cuando ocurra el 503; adjuntar el `.json` (o el fragmento del request/response) para que api-ia reproduzca y ajuste timeout/lógica. |

**Resumen:** El ajuste principal es en **api-ia** (timeout o rendimiento). Desde el front se puede mejorar el mensaje al usuario y aportar pruebas reales.

---

## 4. Resumen rápido

| Problema | Tipo | Solución principal |
|----------|------|---------------------|
| **app-test 502** | Infra / despliegue | Subir/reiniciar el proceso que sirve app-test y revisar origin en Cloudflare. |
| **chat-test 500** | Servidor / configuración | Logs del servidor Next.js de chat-test + variables de entorno y dependencias. |
| **api-ia 503** | Backend api-ia | Aumentar timeout o optimizar; desde el repo: buen mensaje al usuario y enviar evidencia (script de pruebas reales). |

---

## Comandos útiles

```bash
# Comprobar estado actual
curl -s -o /dev/null -w "app-test: %{http_code}\n" https://app-test.bodasdehoy.com/
curl -s -o /dev/null -w "chat-test: %{http_code}\n" https://chat-test.bodasdehoy.com/

# Generar evidencia completa (chat/app-test + api-ia + api2)
node scripts/ejecutar-pruebas-reales-todas.mjs
```

Evidencia generada en: `test-results/pruebas-reales-completo-*.json` y `*.md`.
