# Revisar parámetros en Cloudflare (solo lectura)

Este documento describe cómo **revisar** la configuración de Cloudflare para app-test y chat-test **sin modificar nada**. Útil cuando tienes acceso a la API con permisos de solo lectura.

## Script de revisión

- **Script:** `scripts/cloudflare-revisar-parametros.sh`
- **Qué hace:** Solo llamadas **GET** a la API de Cloudflare:
  - Obtiene el Zone ID de `bodasdehoy.com` (si no lo tienes).
  - Lista los registros DNS de la zona y filtra por `app-test` y `chat-test`.
- **Qué no hace:** No crea, edita ni borra ningún registro ni configuración.

## Cómo usarlo

1. **Crear un API Token de solo lectura** (si no tienes uno):
   - Cloudflare Dashboard → My Profile → API Tokens → Create Token.
   - Usar template **"Read all resources"** o permisos mínimos: **Zone / Zone Read** y **DNS Read**.
   - No incluyas permisos de Edit/Delete.

2. **Exportar variables** (o añadirlas a `.env` en la raíz del repo, sin commitear):
   ```bash
   export CLOUDFLARE_API_TOKEN="tu_token_solo_lectura"
   # Opcional si ya conoces el Zone ID:
   export CLOUDFLARE_ZONE_ID="id_de_la_zona_bodasdehoy"
   ```

3. **Ejecutar el script:**
   ```bash
   ./scripts/cloudflare-revisar-parametros.sh
   ```

El script imprimirá los registros DNS actuales para app-test y chat-test y recordará los valores esperados para que las URLs carguen.

## Qué revisar en el resultado

- **DNS:** Que existan CNAME para `app-test` y `chat-test` con:
  - **Contenido:** `30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com`
  - **Proxied:** `true`

- **Public Hostnames (Zero Trust):** El script no puede listarlos con la API estándar de DNS; hay que revisarlos en el dashboard:
  - Zero Trust → Tunnels → **lobe-chat-harbor** → Public Hostnames.
  - Debe haber: **app-test.bodasdehoy.com** → localhost:8080 y **chat-test.bodasdehoy.com** → localhost:3210.

## Referencia

- Pasos para **modificar** (quien tenga permisos): [LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md](./LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md) y [PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md](./PLAN-DOS-PROBLEMAS-APP-TEST-Y-CHAT-TEST.md).
