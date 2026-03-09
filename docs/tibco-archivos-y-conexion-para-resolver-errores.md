# Archivos a descargar y cómo conectarse para resolver errores TIBCO

Para poder resolver errores con **error del frontal + flujo + traza** (y usar Cursor como en [tibco-usar-cursor-para-detectar-error.md](tibco-usar-cursor-para-detectar-error.md)), necesitas **obtener** esos tres datos. Aquí se indica qué descargar y cómo conectarte a TIBCO.

---

## Resumen rápido

| Qué necesitas | Dónde/con qué obtenerlo |
|---------------|-------------------------|
| **Error del frontal** | Respuesta HTTP que recibe quien llama (Postman, DevTools, logs del frontal). No hace falta descargar de TIBCO. |
| **Flujo (flogo.json)** | Descarga desde TIBCO Cloud UI, API de export o `tibcli` / binario con `--export app`. |
| **Traza / petición** | Execution History en TIBCO Cloud, logs del Hybrid Agent, o logs de tu frontal (request + response). |
| **Conexión a TIBCO** | Cuenta TIBCO Cloud + **tibcli** (descarga desde Environment & Tools) o **API REST** con OAuth. |

---

## 1. Descargar e instalar el CLI (tibcli)

El **TIBCO Cloud CLI** te permite listar apps, exportar flujos y trabajar desde terminal/scripts. Es la forma más directa de “conectarte” para obtener el flujo.

### 1.1 Dónde descargar

1. Entra en **TIBCO Cloud Integration**: [https://integration.cloud.tibco.com](https://integration.cloud.tibco.com).
2. Inicia sesión con tu cuenta.
3. En la barra superior: **Environment & Tools** (o **Herramientas**).
4. En **Tool Downloads** elige **TIBCO Cloud - Command Line Interface**.
5. Elige **plataforma** (Windows / macOS / Linux) y descarga el ejecutable (`tibcli` o `tibcli.exe`).

El archivo viene asociado a tu usuario; no sirve compartir el ejecutable de otro.

Documentación: [Downloading TIBCO Cloud Integration Tools](https://integration.cloud.tibco.com/docs/tci/getstarted/installation/download-tools.html).

### 1.2 Instalación (macOS/Linux)

```bash
# Mover a una carpeta en el PATH, por ejemplo:
mv ~/Downloads/tibcli ~/bin/   # o ~/tibcli/
chmod 755 ~/bin/tibcli

# Añadir al PATH (ejemplo para zsh)
echo 'export PATH=$PATH:$HOME/bin' >> ~/.zshrc
source ~/.zshrc

# Comprobar
tibcli --version
```

### 1.3 Autenticación

```bash
# Opción A: token OAuth (recomendado para scripts)
# Genera el token en: TIBCO Cloud → Account / Organization → OAuth Token
tibcli authorize
# o: tibcli authorize --token <tu_token>

# Opción B: usuario y contraseña
tibcli login
```

La sesión caduca (por ejemplo a los 30 minutos); para exportar o listar apps necesitas estar autorizado.

---

## 2. Obtener el flujo (flogo.json)

Tienes varias formas de “descargar” o exportar el flujo para tener el archivo que usarás en `docs/tibco-debug/flujo.json`.

### 2.1 Desde la interfaz web (TIBCO Cloud Integration)

1. Entra en tu **organización** y abre la **app** (Flogo) que falla.
2. Menú de la app → **Export** / **Export app** (o “Export and open JSON” si está disponible).
3. Se descarga el **flogo.json** (o un ZIP con flogo.json + manifest.json).
4. Guarda ese JSON en tu proyecto, por ejemplo como `docs/tibco-debug/flujo.json`.

Documentación: [Exporting an App's JSON File](https://integration.cloud.tibco.com/docs/Subsystems/flogo/flogo-all/exporting-an-apps-j.html).

### 2.2 Con la API REST (export)

Necesitas:

- **Subscription Locator**: lo obtienes con `GET /v1/userinfo` (lista de organizaciones y sus locators).
- **App ID**: con `GET /v1/subscriptions/{subscriptionLocator}/apps` ves las apps y sus IDs.

Llamada para exportar:

```http
GET /v1/subscriptions/{subscriptionLocator}/apps/{appId}/export
```

Opcional: `?manifest=true` para recibir un ZIP con `flogo.json` y `manifest.json`.

- Base URL: la de tu región TIBCO Cloud (ej. `https://integration.cloud.tibco.com`).
- Autenticación: **Bearer token** (OAuth). Puedes usar el mismo token que configuras en `tibcli authorize`.

Documentación: [Exporting a TIBCO Flogo® App with the API](https://integration.cloud.tibco.com/docs/Subsystems/tci-api/apps/export-app.html).

### 2.3 Desde un binario Flogo ya desplegado

Si tienes el ejecutable de la app (por ejemplo generado con “Build app”):

```bash
./nombre-del-ejecutable --export app
# Genera: nombre-del-ejecutable.json

# O con nombre de salida:
./nombre-del-ejecutable --export -o flujo.json app
```

Ese JSON es el flujo; cópialo a `docs/tibco-debug/flujo.json` si quieres.

---

## 3. Obtener el error del frontal

El **error** es lo que recibe quien llama a vuestra integración (el “frontal” o cualquier cliente). No hace falta descargarlo desde TIBCO; lo obtenéis desde el cliente:

- **Postman / Insomnia**: copiar la respuesta (status, headers, body) y pegarla en `docs/tibco-debug/error.json` (o en un `error.md` si es texto).
- **Navegador (DevTools)**: pestaña Network → request que falla → copiar respuesta.
- **Logs del frontal**: si el frontal guarda la respuesta de vuestra API, copiar de ahí el JSON o texto de error.

Si vuestra app TIBCO ya devuelve un formato unificado (como en [ejemplo-tibco-flujo-errores-backends.md](ejemplo-tibco-flujo-errores-backends.md)), el body suele tener `source`, `ourStep`, `message`, etc.; eso es justo lo que debes pegar en `error.json`.

---

## 4. Obtener la traza / petición

La **traza** es la secuencia de pasos y la petición que llegó. Opciones:

### 4.1 Execution History (TIBCO Cloud)

- En TIBCO Cloud Integration, muchas organizaciones tienen **Execution History** para ver ejecuciones de apps (sobre todo en Hybrid Agent / Flogo).
- Entra en la app → pestaña **Execution History** (o similar) → busca la ejecución por hora o por **request ID / correlation ID** (si lo pasáis en headers).
- Ahí puedes ver qué actividad falló y, a veces, request/response. Copia esa información a `docs/tibco-debug/traza.md`.

Si no ves la pestaña, un admin puede tener que activar el servicio para la organización vía API: [Enabling the Execution History Service](https://integration.cloud.tibco.com/docs/Subsystems/tci-api/organization/enable-ex-hist.html).

### 4.2 Logs del Hybrid Agent

Si la app corre en **Hybrid Agent**, puedes obtener logs con streaming:

- Opción **log streaming** del agente (por ejemplo con `--logStream`), con logs en JSON (timestamps, nivel, mensajes).
- Copia las líneas relevantes a la hora del error y pégalas en `traza.md`, indicando request (URL, method, body si lo tienes).

Documentación: [Streaming Logs from Apps with the Hybrid Agent](https://integration.cloud.tibco.com/docs/tci/using/hybrid-agent/hybrid-proxy/log-streaming.html).

### 4.3 Tracing distribuido (Flogo)

Si tenéis **tracing** (por ejemplo Jaeger) configurado en Flogo:

- Abre la traza correspondiente al request (por request ID o tiempo).
- Los **spans** muestran cada actividad; el que falle o tarde mucho es el paso a anotar en `traza.md`.

Documentación: [App Tracing](https://integration.cloud.tibco.com/docs/Subsystems/flogo/flogo-all/app-tracing.html).

### 4.4 Montar la traza a mano

Si no tienes Execution History ni logs a mano, puedes rellenar `traza.md` con:

- **Request**: método, URL, headers, body (lo que envió el frontal o lo que ves en Postman).
- **RequestId / CorrelationId** si lo tenéis.
- Lo que sepáis del error (mensaje, `ourStep` si viene en la respuesta, hora).

Con eso Cursor ya puede cruzar error + flujo + request.

---

## 5. Conexión por API (sin tibcli)

Si prefieres **solo API REST** (scripts, Postman, etc.):

1. **OAuth token**  
   Generado en la cuenta/organización de TIBCO Cloud (Account / Organization settings). Se usa como Bearer en todas las peticiones.

2. **Base URL**  
   La de tu región, por ejemplo: `https://integration.cloud.tibco.com` (ajusta si usas EU, AU, etc.).

3. **Endpoints útiles**  
   - `GET /v1/userinfo` → organizaciones y subscription locators.  
   - `GET /v1/subscriptions/{subscriptionLocator}/apps` → listado de apps y IDs.  
   - `GET /v1/subscriptions/{subscriptionLocator}/apps/{appId}/export` → descarga del flujo (flogo.json o ZIP).

4. **Client ID**  
   Si usas flujos OAuth más complejos, puede hacer falta un Client ID de la organización: [Obtaining Client ID](https://account.cloud.tibco.com/cloud/docs/accounts/account-info/obtaining_clientID.html).

No hace falta instalar ningún archivo extra para la API; solo un cliente HTTP y el token.

---

## 6. Checklist: qué tener para resolver un error

- [ ] **Cuenta TIBCO Cloud** con acceso a la app que falla.
- [ ] **tibcli** descargado desde Environment & Tools e instalado (opcional pero recomendable).
- [ ] **flogo.json** de la app: export desde la UI, desde la API o desde el binario con `--export app`.
- [ ] **Error**: respuesta HTTP (status + body) que recibe el frontal, guardada en `error.json` o `error.md`.
- [ ] **Traza**: Execution History, logs del Hybrid Agent o al menos request (URL, method, body) + hora + requestId en `traza.md`.

Cuando tengas los tres (error, flujo, traza) en `docs/tibco-debug/`, usa la guía [tibco-usar-cursor-para-detectar-error.md](tibco-usar-cursor-para-detectar-error.md) y Cursor para analizar y detectar si el error es vuestro o de un backend.

---

## 7. Enlaces de referencia

| Recurso | URL |
|---------|-----|
| Descarga de herramientas (tibcli) | [Environment & Tools](https://integration.cloud.tibco.com) → Environment & Tools → Tool Downloads |
| Instalación tibcli | [Installing the TIBCO Cloud CLI](https://integration.cloud.tibco.com/docs/tci/getstarted/installation/installing-cli.html) |
| Login tibcli | [Logging In with the CLI](https://integration.cloud.tibco.com/docs/tci/using/using-the-cli/cli-login.html) |
| Export app (API) | [Exporting a Flogo App with the API](https://integration.cloud.tibco.com/docs/Subsystems/tci-api/apps/export-app.html) |
| Export app (UI) | [Exporting an App's JSON File](https://integration.cloud.tibco.com/docs/Subsystems/flogo/flogo-all/exporting-an-apps-j.html) |
| Execution History | [Enabling Execution History (API)](https://integration.cloud.tibco.com/docs/Subsystems/tci-api/organization/enable-ex-hist.html) |
| Log streaming (Hybrid Agent) | [Streaming Logs](https://integration.cloud.tibco.com/docs/tci/using/hybrid-agent/hybrid-proxy/log-streaming.html) |
| App tracing (Flogo) | [App Tracing](https://integration.cloud.tibco.com/docs/Subsystems/flogo/flogo-all/app-tracing.html) |
