# app-test y chat-test: van juntos — Análisis del 502

**Objetivo**: Dejar claro por qué chat-test devuelve 502 y cómo resolverlo manteniendo la pareja app-test + chat-test.

---

## 1. Por qué “van juntos”

En el monorepo, **app-test** y **chat-test** están pensados para usarse en conjunto:

| Entorno   | App              | Puerto | Origen en código                          |
|----------|------------------|--------|------------------------------------------|
| app-test | Web (Next.js)    | 3000   | `apps/web/start.sh`                      |
| chat-test| Copilot (Next.js)| 3210   | `apps/copilot/start.sh`                  |

Configuración común en `ecosystem.config.js` (PM2):

```js
// ecosystem.config.js
apps: [
  { name: 'app-test',  script: './apps/web/start.sh',    ... },  // puerto 3000
  { name: 'chat-test', script: './apps/copilot/start.sh', ... }, // puerto 3210
]
```

- **app-test.bodasdehoy.com** → organizador (eventos, itinerario, etc.).
- **chat-test.bodasdehoy.com** → Copilot/LobeChat (IA).

En la app web, cuando estás en **app-test**, los enlaces “Abrir en nueva pestaña” del Copilot apuntan a **chat-test** para mantener el par test (app-test ↔ chat-test). Si chat-test devuelve 502, ese flujo se rompe.

---

## 2. Por qué chat-test devuelve 502

El **502 Bad Gateway** lo devuelve el proxy (p. ej. Cloudflare) cuando **no puede obtener una respuesta válida del servidor de origen**.

Resumen del flujo:

```
Navegador → Cloudflare (OK) → Origen de chat-test → ❌ no responde → 502
```

Causas típicas:

1. **No hay proceso escuchando** detrás de `chat-test.bodasdehoy.com`: el DNS apunta a una IP/puerto donde no corre el Copilot (puerto 3210 o el que use el proxy).
2. **chat-test y app-test no se despliegan juntos**: app-test está en un servidor, pero el dominio chat-test apunta a otro sitio donde no se ha levantado el Copilot.
3. **Proxy mal configurado**: el virtual host o upstream para `chat-test.bodasdehoy.com` no reenvía al puerto correcto (3210).

Por tanto: **app-test y chat-test “van juntos” en código y diseño, pero en infraestructura chat-test no tiene un origen que responda**, y por eso sigue saliendo 502.

---

## 3. Soluciones (las dos van juntas con app-test)

### Opción A: DNS CNAME — chat-test apuntando a chat (rápido)

Sin tocar servidores ni PM2:

1. En **Cloudflare** (o tu DNS): dominio `bodasdehoy.com`.
2. **DNS → Records**: crear o editar el registro de **chat-test**.
3. Dejar:
   - **Type**: CNAME  
   - **Name**: `chat-test`  
   - **Target**: `chat.bodasdehoy.com`  
   - **Proxy**: Proxied (nube naranja), si usas proxy.
4. Guardar y esperar unos minutos.

Efecto: **chat-test.bodasdehoy.com** usará el **mismo servidor que chat (producción)**. Así dejas de tener 502 y el par “app-test + chat-test” funciona; la única diferencia es que el backend de chat-test será el de producción.

Verificación:

```bash
curl -I https://chat-test.bodasdehoy.com
# Debe devolver 200 (no 502).
```

---

### Opción B: Mismo servidor que app-test (par “real” test)

Para que app-test y chat-test “vayan juntos” también en el servidor:

1. **Misma máquina** donde corre app-test (o donde resuelve `app-test.bodasdehoy.com`).
2. Arrancar **los dos** procesos con PM2:
   ```bash
   cd /ruta/al/monorepo
   pm2 start ecosystem.config.js
   # o: pm2 start apps/copilot/start.sh --name chat-test
   ```
3. **Proxy inverso** (nginx u otro) en esa máquina:
   - `app-test.bodasdehoy.com` → `localhost:3000`
   - `chat-test.bodasdehoy.com` → `localhost:3210`
4. **DNS**: `chat-test.bodasdehoy.com` debe apuntar a la **IP de esta misma máquina** (no a otra).

Así, app-test y chat-test corren juntos en el mismo servidor y el 502 desaparece si el proxy y los puertos están bien configurados.

Comprobaciones en el servidor:

```bash
# Procesos
pm2 list
ps aux | grep next

# Puertos
lsof -i :3000   # app-test
lsof -i :3210   # chat-test
```

---

## 4. Resumen

| Tema | Conclusión |
|------|------------|
| **¿Van juntos?** | Sí: mismo repo, mismo `ecosystem.config.js`; app-test (web) + chat-test (Copilot). |
| **¿Por qué 502 en chat-test?** | El origen al que apunta `chat-test.bodasdehoy.com` no responde (no hay proceso en 3210 o proxy mal configurado). |
| **Solución rápida** | CNAME de `chat-test` → `chat.bodasdehoy.com` en Cloudflare/DNS (Opción A). |
| **Solución “par test” en servidor** | Misma máquina que app-test, PM2 con ambos procesos, proxy a 3000 y 3210, DNS de chat-test a esa IP (Opción B). |

Con la Opción A, chat-test deja de dar 502 de inmediato y el par app-test + chat-test queda usable aunque el backend de chat sea el de producción. Con la Opción B mantienes un entorno test completo (app-test + chat-test) en un solo servidor.
