# Por qué las mejoras del Copilot no se ven

Resumen de causas por las que el usuario puede no ver las mejoras (banner "Recuperar conversación", historial en el chat, system prompt "mostrar en chat cuando no se pueda en pantalla", etc.).

---

## 1. El layout usaba el Copilot en **iframe**, no el **embed**

En **app-eventos** hay dos formas de mostrar el Copilot:

| Componente | Qué muestra | Dónde están las mejoras |
|------------|-------------|-------------------------|
| **ChatSidebar** | **CopilotIframe** → carga LobeChat (chat-ia) en un iframe | No: el iframe es otra app (chat-ia). Banner e historial están en el embed. |
| **ChatSidebarDirect** | **CopilotEmbed** → chat nativo con nuestros componentes | Sí: banner "Recuperar conversación", envío de `messageHistory`, mismo proxy. |

**Antes:** `Container.tsx` usaba `<ChatSidebar />`, es decir **CopilotIframe**. Por tanto:
- El banner "¿Recuperar conversación anterior o nueva?" **no se veía** (está en CopilotEmbed).
- El historial que enviamos al backend **sí** se usa cuando el proxy recibe la petición; pero la **UI** del iframe (LobeChat) no muestra nuestro banner ni carga la última conversación al abrir.

**Solución aplicada:** Cambiar el layout para usar **ChatSidebarDirect** (CopilotEmbed) en lugar de ChatSidebar (CopilotIframe), así las mejoras de la sesión (banner, historial en la misma conversación) se ven en la app.

Si en algún momento se quiere volver al iframe (LobeChat), basta con usar de nuevo `ChatSidebar` en `Container.tsx`.

---

## 2. No desplegar → se sigue sirviendo la versión antigua

Las mejoras están en el código, pero **app-test** (y producción) sirven lo que esté **desplegado**. Si no se ha hecho deploy de app-eventos después de los cambios:
- Sigue en producción la versión anterior (sin banner, sin historial en el embed, o con el layout que usaba iframe).
- Para ver los cambios: **recompilar** (`pnpm build` en app-eventos) y **desplegar** en el entorno correspondiente.

---

## 3. Partes que dependen de **otros** servicios

Estas mejoras sí están "implementadas" en app-eventos pero su efecto completo depende de otros sistemas:

| Mejora | En app-eventos | Falta en |
|--------|----------------|----------|
| Modelo razonador | Proxy envía `X-Prefer-Reasoning-Model` y `prefer_reasoning_model` | **api-ia (Python)** debe leer el header/body y enrutar al modelo razonador. Ver `docs/API-IA-MODELO-RAZONADOR.md`. |
| Recuperar conversación en el **iframe** | N/A (nosotros usamos embed) | Si se usara otra vez el iframe (LobeChat), **chat-ia** tendría que cargar la última conversación al abrir (p. ej. por sessionId/cookie). |

---

## 4. Resumen

- **Para que se vean** el banner y el historial en la misma conversación: el layout debe usar **ChatSidebarDirect** (CopilotEmbed) y la build desplegada debe ser la que incluye ese cambio y las mejoras en el proxy/embed.
- **Para que el modelo razonador** se use de verdad: hay que implementar en **api-ia** la lectura de `X-Prefer-Reasoning-Model` / `prefer_reasoning_model`.
- **Para ver cualquier cambio en app-test:** hace falta **desplegar** la nueva build de app-eventos.
