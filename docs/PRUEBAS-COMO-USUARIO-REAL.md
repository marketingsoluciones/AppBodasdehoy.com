# Pruebas como usuario real (credenciales)

Para comprobar si el 503 en POST /webapi/chat/auto se debe a **no enviar usuario** (Authorization: Bearer &lt;JWT&gt;) o a credenciales whitelabel en API2, las pruebas pueden ejecutarse como un **usuario determinado** con email y contraseña que el front puede facilitar.

---

## 1. Variables que debe facilitar el front

| Variable | Uso | Ejemplo (no usar credenciales reales en el repo) |
|----------|-----|--------------------------------------------------|
| **TEST_USER_EMAIL** | Email del usuario de prueba (Firebase Auth, proyecto bodasdehoy). | `usuario@ejemplo.com` |
| **TEST_USER_PASSWORD** | Contraseña de ese usuario. | Definir en .env o pasar solo por entorno. |

**Importante:** No guardar contraseñas en el repo. Solo leerlas de entorno (`.env` que no se sube, o variables de CI).

---

## 2. Cómo ejecutar las pruebas con ese usuario

### Opción A: Test rápido (health + chat + config) y envío a Slack

```bash
TEST_USER_EMAIL="<email que facilite el front>" \
TEST_USER_PASSWORD="<contraseña>" \
bash scripts/test-api-ia-y-enviar-slack.sh
```

El script obtiene el idToken de Firebase con ese usuario y envía **Authorization: Bearer &lt;idToken&gt;** en POST /webapi/chat/auto. En Slack se indica "Chat: con usuario (Authorization: Bearer &lt;token&gt;)".

### Opción B: Solo obtener el token (para usarlo en otros scripts)

```bash
export FIREBASE_JWT=$(TEST_USER_EMAIL="..." TEST_USER_PASSWORD="..." ./scripts/get-firebase-token.sh)
# Luego:
bash scripts/test-api-ia-y-enviar-slack.sh   # usa FIREBASE_JWT si está definido
# o
FIREBASE_JWT="$FIREBASE_JWT" node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-preguntas-api-ia.json
```

### Opción C: 20 preguntas con usuario (recomendado para diagnóstico)

```bash
TEST_USER_EMAIL="<email>" TEST_USER_PASSWORD="<contraseña>" \
node scripts/get-firebase-token-and-run-20.mjs --json --output docs/resultados-20-preguntas-api-ia.json
```

`get-firebase-token-and-run-20.mjs` obtiene el token y ejecuta las 20 preguntas con **Authorization: Bearer &lt;token&gt;** en cada request.

---

## 3. Por qué no conectamos: qué comprobar

| Escenario | Interpretación |
|-----------|----------------|
| **Sin usuario (solo X-Development):** 503 | Puede ser (a) api-ia/API2 requieren JWT para resolver credenciales whitelabel, o (b) credenciales whitelabel bodasdehoy mal en API2. |
| **Con usuario (Authorization: Bearer &lt;JWT&gt;):** 200 | El problema era no enviar usuario; en producción la app ya envía idToken, así que conviene seguir probando con usuario. |
| **Con usuario:** sigue 503 | El fallo no es por falta de JWT; toca a API2/api-ia (credenciales whitelabel). Seguir enviando a Slack request/response y trace_id con y sin usuario para que api-ia compare. |

---

## 4. Requisitos

- **Firebase:** Usuario debe existir en el proyecto bodasdehoy (bodasdehoy-1063). El script usa la misma API key que la web (identitytoolkit signInWithPassword).
- **jq:** El script `get-firebase-token.sh` usa `jq` para parsear la respuesta de Firebase. Instalar si falta: `brew install jq` (macOS).
