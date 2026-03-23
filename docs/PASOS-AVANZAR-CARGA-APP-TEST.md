# Pasos para avanzar: pantalla "Cargando..." en app-test

## Objetivo

Que en app-test.bodasdehoy.com la pantalla "Cargando... Si ves esto, la app está respondiendo (máx. 1.5 s)" no se quede fija: que a los 2 s aparezca el botón "Continuar como invitado" y que a los 5 s se muestre la app aunque la verificación no haya terminado.

## Qué está ya en código (apps/appEventos)

- Timeout 1,5 s: si la verificación no termina, se muestra la app como invitado.
- A los 2 s: se muestra el botón **"Continuar como invitado"** (click = entrar como guest).
- Timeout 5 s: si sigue en carga, se fuerza `verificationDone` y usuario guest.

Todo está en `apps/appEventos/context/AuthContext.tsx`.

## Qué hacer para avanzar

1. **Desplegar app-eventos (app-test)**  
   - Build: desde la raíz del repo, `pnpm build:web` (construye `apps/appEventos`).  
   - Subir los cambios y desplegar como siempre (push a la rama que dispara el deploy de app-test, o tu pipeline habitual).  
   Así app-test.bodasdehoy.com servirá la versión con timeouts y botón "Continuar como invitado".

2. **Comprobar tras el deploy**  
   - Abrir https://app-test.bodasdehoy.com  
   - Si a los 2 s no aparece el botón "Continuar como invitado", la versión desplegada sigue siendo antigua.  
   - O ejecutar:
     ```bash
     BASE_URL=https://app-test.bodasdehoy.com node scripts/ver-pantalla-app-test.mjs
     ```
     Debe mostrar "¿Aparece botón Continuar como invitado? Sí" a los 6 s (o "¿Parece contenido de la app? Sí").

3. **Si no puedes desplegar aún**  
   Revisar por qué la verificación se cuelga (API de config, Firebase, `moreInfo`): ver consola del navegador (errores, `[Verificator]`, `[Auth]`) y `docs/ANALISIS-CARGANDO-APP-RESPONDIENDO.md`.

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Desplegar app-eventos para que app-test tenga la versión con timeouts y botón. |
| 2 | Comprobar en el navegador o con `scripts/ver-pantalla-app-test.mjs`. |
