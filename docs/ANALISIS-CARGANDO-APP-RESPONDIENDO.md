# Análisis: "Cargando... Si ves esto, la app está respondiendo (máx. 1.5 s)"

## Dónde aparece

- **App:** app-eventos (app-test.bodasdehoy.com).
- **Archivo:** `apps/appEventos/context/AuthContext.tsx`.
- **Componente:** `AuthProvider` — pantalla de carga (`loadingScreen`) que se muestra hasta que `verificationDone === true`.

---

## Qué significa el mensaje

1. **"Cargando..."** — La app está en fase de verificación de sesión (auth/config).
2. **"Si ves esto, la app está respondiendo"** — El front ya ha cargado y pinta esta UI; el servidor web responde.
3. **"(máx. 1.5 s)"** — Orientativo: en condiciones normales la verificación suele terminar en menos de 1,5 s.

---

## Cuándo se muestra

Se muestra **siempre** que:

```ts
verificationDone === false
```

Es decir, desde que monta `AuthProvider` hasta que algo pone `verificationDone` a `true`. No depende de que haya error; es el estado inicial.

---

## Flujo que debe terminar para que desaparezca

1. **Montaje**  
   - `AuthProvider` monta con `verificationDone = false` → se pinta `loadingScreen` (el mensaje).

2. **Config**  
   - Un `useEffect` pide la config (p. ej. `getDevelopmentConfig` / API) y hace `setConfig(resp)`.
   - Si esta petición falla o no responde, `config` puede quedar `undefined` y el siguiente paso no se dispara igual.

3. **Auth state**  
   - Otro `useEffect` con dependencia `[config]` se suscribe a `onAuthStateChanged(getAuth(), ...)`.
   - Cuando Firebase notifica estado (logueado o no), se llama a `setTriggerAuthStateChanged(...)`.

4. **Verificator**  
   - Un `useEffect` que depende de `triggerAuthStateChanged` llama a `verificator({ user, sessionCookie })`.
   - `verificator`:
     - Lee cookie de sesión y usuario de Firebase.
     - Según el caso, llama a `moreInfo(user)` o pone directamente `setVerificationDone(true)` (o crea guest y pone `verificationDone`).

5. **moreInfo (si se llama)**  
   - Hace `fetchApiBodas` (p. ej. `getUser`) y en el `finally` hace **siempre** `setVerificationDone(true)`.
   - Si esa petición **nunca** resuelve ni rechaza (red colgada, API caída sin timeout), el `finally` no se ejecuta y la pantalla se queda en "Cargando...".

Cualquier rama que no llame a `setVerificationDone(true)` y que sea la única que se ejecute deja la app atascada en esa pantalla.

---

## Mecanismos de seguridad para no quedarse atascado

En el código actual hay varias redes de seguridad:

| Mecanismo            | Tiempo  | Acción |
|----------------------|--------|--------|
| Timeout 1            | 1,5 s  | Si `!verificationDone`, se hace `setVerificationDone(true)` y se crea usuario guest. |
| Botón manual         | 2 s    | Aparece el botón "Continuar como invitado"; al pulsar se fuerza guest y `verificationDone(true)`. |
| Timeout 2            | 5 s    | Si sigue `!verificationDone`, se fuerza de nuevo guest y `setVerificationDone(true)`. |

Si **todo** eso está en el build que estás usando, como mucho deberías ver la pantalla 1,5–5 s o poder salir antes con el botón.

---

## Por qué puedes seguir viendo solo "Cargando..." y nada más

Posibles causas:

1. **Build antiguo**  
   Sin los timeouts o sin el botón "Continuar como invitado" → la pantalla puede quedarse indefinidamente si el flujo normal no termina.

2. **`config` nunca llega**  
   Si la petición de config falla o no responde, el efecto que registra `onAuthStateChanged` puede no ejecutarse o no con la config correcta, y `verificator` no se llama (o no con cookie), y nunca se pone `verificationDone(true)` salvo por los timeouts/botón.

3. **`moreInfo` colgado**  
   Si `verificator` llama a `moreInfo(user)` y la petición `fetchApiBodas` (getUser, etc.) no responde ni falla, el `finally` no se ejecuta y no se hace `setVerificationDone(true)`. Dependes entonces de los timeouts o del botón.

4. **`verificator` no se ejecuta**  
   Si `triggerAuthStateChanged` no se actualiza (por ejemplo porque el efecto que depende de `config` no corre o Firebase no dispara), `verificator` no se llama y solo los timeouts/botón pueden sacarte de la pantalla.

5. **Rama de `verificator` sin `setVerificationDone`**  
   Algún camino lógico dentro de `verificator` que no llama a `setVerificationDone(true)` ni a `moreInfo` (que sí lo hace en `finally`) y que sea el único que se ejecuta en tu caso.

---

## Dónde está el texto en código

```ts
// apps/appEventos/context/AuthContext.tsx (aprox. líneas 795-798)

<p className="mt-4 text-gray-700 font-medium">Cargando...</p>
<p className="mt-1 text-sm text-gray-400">Si ves esto, la app está respondiendo (máx. 1.5 s)</p>
```

Ese bloque está dentro de `loadingScreen`, que se renderiza cuando:

```ts
{verificationDone ? children : loadingScreen}
```

Es decir: se muestra **todo** el contenido de la app (`children`) cuando `verificationDone === true`; si no, solo la pantalla de "Cargando... Si ves esto, la app está respondiendo (máx. 1.5 s)".

---

## Resumen

- El mensaje es la **pantalla de carga de auth** de app-test: indica que el front responde y está esperando a que termine la verificación de sesión.
- Para que desaparezca hace falta que algo ponga `verificationDone` a `true` (flujo normal o timeouts/botón).
- Si solo ves ese texto y nada más, la verificación no está terminando y los fallbacks (1,5 s, 2 s botón, 5 s) no están actuando o no están en el build que usas. Revisar consola (errores, `[Verificator]`, `[Auth]`) y red (config, getUser) y asegurarse de tener desplegado el código con timeouts y botón "Continuar como invitado".
