# Diagnóstico: IA no ejecutó filtro + texto del banner de crédito

## 1. Por qué el agente de IA no respondió o no ejecutó

En las pruebas E2E con confirmación visual ocurrió:

- **Paso 1:** La IA quedó en "Analizando tu solicitud... Consultando get table details... Formulando tu respuesta..." y no llegó a terminar en el tiempo de espera (45–90 s).
- **Paso 2:** No se mostró la pantalla de mesas ni la barra de filtro (no se aplicó `filter_view` en la app).

**Causas probables:**

1. **Timeout / latencia del backend de IA**  
   El backend que procesa el chat (Python/OpenAI) puede tardar mucho en responder. Si la respuesta no llega a tiempo, el front no recibe la llamada a la herramienta `filter_view` y la app no filtra ni navega.

2. **Errores 502 Bad Gateway**  
   En los logs aparecieron `502 (Bad Gateway)` en llamadas a api-ia o middleware. Si el backend de IA falla, no hay respuesta ni ejecución de herramientas.

3. **Herramienta `filter_view`**  
   - Está definida en `apps/chat-ia/src/tools/filter-app-view` y se envía al modelo.  
   - El modelo debe decidir llamar a `filter_view` con `entity: "tables"` y los IDs correspondientes.  
   - Si el modelo no recibe datos de mesas (por ejemplo, por falta de `screenData`/PAGE_CONTEXT con las mesas del evento) o no interpreta bien la intención, puede no hacer la llamada.

4. **Datos de contexto**  
   La herramienta indica que los IDs vienen de `screenData` (PAGE_CONTEXT). Si la app no inyecta las mesas en ese contexto o el bridge tarda, el modelo no tiene IDs para filtrar "mesa 1".

**Qué revisar para que funcione:**

- Que el backend de IA (api-ia / Python) responda sin 502 y dentro de un tiempo razonable.
- Que el CopilotBridge inyecte PAGE_CONTEXT con `screenData` que incluya las mesas del evento (con `id`).
- Que el modelo tenga la herramienta `filter_view` disponible y que, ante "Quiero ver la mesa 1", devuelva una tool call con `entity: "tables"` y los IDs correctos.

---

## 2. Pantalla de mesas no mostrada

Es consecuencia directa del punto 1: si la IA no termina de responder o no llama a `filter_view`, la app (appEventos) no recibe el `postMessage` FILTER_VIEW y por tanto:

- No se muestra la barra de filtro.
- No se navega a `/mesas` ni se aplica el filtro a una mesa concreta.

Cuando la IA ejecute correctamente `filter_view` y la app reciba el mensaje, la pantalla de mesas (y/o la barra de filtro) debería mostrarse.

---

## 3. Error de redacción del banner (Saldo €49.98)

**Problema:**  
El banner de "Modo crédito activo" mostraba solo **"Saldo: €49.98"**, lo que resulta confuso:

- Lo que interesa no es solo un número tipo 49.98, sino:
  - **Saldo real:** puede ser 0 o negativo (ej. €-0,02) cuando se está en modo crédito.
  - **Límite de crédito:** hasta cuánto puede consumir el usuario.

**Cambio realizado:**  
En `apps/chat-ia/src/components/Wallet/NegativeBalanceBanner.tsx` se actualizó el texto para:

- Mostrar **Saldo real:** `balance` (el valor que viene del API, que puede ser 0 o negativo).
- Mostrar **Límite de crédito:** `creditLimit` (hasta cuánto puede consumir), cuando `credit_limit > 0`.
- Mantener la frase "El chat continúa, pero tienes deuda pendiente" solo cuando el saldo real sea negativo (`balance < 0`).

Así se deja de mostrar un único "Saldo: €49.98" ambiguo y se explica claramente el saldo real y el límite de crédito.
