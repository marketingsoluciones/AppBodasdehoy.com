# Informe para el equipo SuitePro / web-dev

**Fecha:** 2026-09-14  
**Propósito:** entregar el estado observado sin modificar el frontend de SuitePro.

## 1. Alcance

Durante esta auditoría no se cambió código de SuitePro. Se separó su trabajo para no bloquear el cierre de AppEventos y chat.

Se comprobó la infraestructura que sirve SuitePro y los subdominios `web-dev` de las marcas Bodas de Hoy y Eventos Organizador.

## 2. Equipos y enrutado real

El equipo desde el que se realizó la auditoría es:

- Nombre: `MacBook Pro de juan`.
- Hostname: `MacBook-Pro-de-juan.local`.
- IP Tailscale configurada como origen de `web-dev`: `100.105.48.36`.

El Mac Mini es otro equipo:

- Hostname: `Mac-mini-de-juan.local`.
- Ejecuta Cloudflare Tunnel.
- Ejecuta un proceso PM2 `suite-dev`.
- Repositorio observado de SuitePro: `/Volumes/HD MAC BASE/Projects/CrmPro-1`.
- Puerto observado para ese proceso: 3300.

El túnel del Mac Mini contiene esta configuración:

```text
web-dev.bodasdehoy.com            -> http://100.105.48.36:4000
web-dev.eventosorganizador.com    -> http://100.105.48.36:4000
```

Por tanto, `web-dev` no apunta al proceso `suite-dev` del Mac Mini en 3300. Apunta por Tailscale al MacBook Pro en 4000.

## 3. Evidencia actual

| Comprobación | Resultado |
|---|---|
| PM2 `suite-dev` en Mac Mini | `online` |
| Acceso local al proceso de SuitePro en Mac Mini | redirección 307 a login |
| `https://web-dev.bodasdehoy.com` | 502 |
| `https://web-dev.eventosorganizador.com` | 502 |
| Listener en puerto 4000 del MacBook Pro | no existe en la comprobación final |

La causa directa del 502 es operativa: Cloudflare llega al Mac Mini, pero el origen configurado `100.105.48.36:4000` no acepta conexiones.

Esto no demuestra un error de compilación de SuitePro. Demuestra que el proceso que el túnel espera en el MacBook Pro no está iniciado o que el túnel apunta al origen equivocado.

## 4. Decisión necesaria del equipo SuitePro

El equipo debe elegir y documentar una sola topología DEV:

### Opción A — SuitePro se ejecuta en el MacBook Pro

1. Confirmar el repositorio que debe arrancar en este MacBook Pro.
2. Compilarlo o ejecutarlo en el puerto 4000.
3. Escuchar en `0.0.0.0:4000`, no solo en localhost, para que Tailscale pueda acceder.
4. Verificar desde el Mac Mini: `curl http://100.105.48.36:4000`.
5. Mantener la configuración actual del túnel.

### Opción B — SuitePro se ejecuta en el Mac Mini

1. Confirmar que PM2 `suite-dev` en 3300 es el proceso canónico.
2. Cambiar ambos hostnames `web-dev` del túnel a `http://127.0.0.1:3300`.
3. Reiniciar Cloudflare Tunnel.
4. Verificar las dos marcas.

No se recomienda mantener dos procesos supuestamente canónicos en equipos diferentes sin indicar cuál atiende el túnel.

## 5. Pruebas de aceptación para su equipo

El trabajo se considera resuelto cuando el equipo aporte evidencia de:

1. `web-dev.bodasdehoy.com` devuelve 200 o una redirección funcional de login, sin 502.
2. `web-dev.eventosorganizador.com` devuelve 200 o una redirección funcional de login, sin 502.
3. Login autenticado válido en ambas marcas.
4. Logout y cambio de cuenta sin identidad, evento ni datos de la cuenta anterior.
5. Bandeja/mensajería de SuitePro usa JWT canónico y no acepta `userId` libre para leer datos.
6. Las llamadas a API-IA/API-MCP incluyen el tenant correcto de cada marca.
7. La compilación usada queda identificada por commit y artefacto.
8. El servicio vuelve después de reiniciar el equipo y PM2 o el supervisor guarda su configuración.
9. Los logs de proxy y aplicación permiten correlacionar un fallo mediante trace ID.
10. Se elimina o documenta el worktree antiguo `.trae` para evitar que otro agente edite una copia no desplegada.

## 6. Mensaje operativo para el equipo

```text
Objetivo:
Restaurar web-dev de Bodas de Hoy y Eventos Organizador y dejar una única topología DEV documentada para SuitePro.

Situación comprobada:
- Cloudflare Tunnel corre en el Mac Mini.
- Ambos web-dev apuntan a 100.105.48.36:4000, el MacBook Pro por Tailscale.
- En el MacBook Pro no hay proceso escuchando en 4000.
- Por eso ambos dominios devuelven 502.
- En el Mac Mini existe PM2 suite-dev online en el puerto 3300, repositorio /Volumes/HD MAC BASE/Projects/CrmPro-1.
- No se modificó código de SuitePro durante la auditoría.

Qué hacer:
1. Decidir si el origen canónico es MacBook Pro:4000 o Mac Mini:3300.
2. Arrancar el proceso correcto o corregir el origen de Cloudflare.
3. Compilar desde el commit dev acordado.
4. Probar ambos dominios con login real de cada marca.
5. Ejecutar las pruebas de identidad, logout, JWT, tenant y mensajería descritas en este informe.
6. Entregar commit, build, proceso, puerto, URLs y evidencias.

Criterio de cierre:
Los dos web-dev dejan de devolver 502, sobreviven a reinicio, permiten login de cada marca y no mezclan identidad ni datos entre usuarios o tenants.
```
