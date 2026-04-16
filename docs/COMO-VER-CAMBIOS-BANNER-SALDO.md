# Cómo ver los cambios del banner de saldo/crédito

El banner modificado está en **chat-ia** (`NegativeBalanceBanner.tsx`). Muestra **Saldo real** (p. ej. €-0,02) y **Límite de crédito** (hasta cuánto puedes consumir). El Copilot que se ve en app-test es un **iframe que carga chat-test**. Por tanto:

## Si usas app-test **desplegado** (https://app-test.bodasdehoy.com)

- El iframe apunta a **https://chat-test.bodasdehoy.com** (también desplegado).
- Los cambios **no se ven** hasta que **despliegues** el build de chat-ia en el entorno de chat-test (Vercel u otro).
- Después del build: `pnpm --filter @bodasdehoy/chat-ia build` → subir/desplegar el resultado a chat-test.

## Si quieres ver los cambios **en local** (sin desplegar)

1. **Compilar / tener chat-ia en marcha en local**
   - Desde la raíz: `pnpm dev:levantar` (app 8080 + chat 3210)  
   - O solo chat: `pnpm --filter @bodasdehoy/chat-ia dev` (puerto 3210).

2. **Hacer que la app cargue el Copilot desde tu chat local**
   - En **appEventos** (app de eventos), el iframe del Copilot usa `NEXT_PUBLIC_CHAT`.
   - Con **app en local** y `NEXT_PUBLIC_CHAT` apuntando al chat en local, verás el nuevo banner.
   - Ejemplo en `apps/appEventos/.env.development.local` (cópialo desde `.env.development.local.example` si no existe):
     ```bash
     NEXT_PUBLIC_CHAT=http://chat-test.bodasdehoy.com:3210
     ```
   - Y en `/etc/hosts`:
     ```
     127.0.0.1   app-test.bodasdehoy.com
     127.0.0.1   chat-test.bodasdehoy.com
     ```

3. **Abrir la app en local**
   - Por ejemplo: `http://app-test.bodasdehoy.com:8080` (con túnel o hosts como arriba).
   - Abre el Copilot: el iframe cargará chat desde `:3210` con el código nuevo.

4. **Volver a ejecutar el test**
   - Ejecutar el test E2E (o el flujo manual) contra esa URL local para ver el banner con "Saldo real" y "Límite de crédito".

## Resumen

- **Solo código en repo** → no se ve en https://app-test.bodasdehoy.com hasta **desplegar chat-ia** en chat-test.
- **Ver en local** → levantar app + chat en local, `NEXT_PUBLIC_CHAT` al chat en :3210, abrir app en :8080 y abrir Copilot; luego repetir el test.
