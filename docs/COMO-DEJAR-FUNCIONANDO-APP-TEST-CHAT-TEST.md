# app-test y chat-test

**Levantar todo (monorepo):**

```bash
pnpm dev:levantar
```

Libera los puertos 8080 y 3210 si estaban ocupados y arranca web (8080) + chat (3210). Sin túnel: http://127.0.0.1:8080 (app) y http://127.0.0.1:3210 (chat). Con túnel Cloudflare, app-test y chat-test apuntan a esos puertos.

**Alternativa:** `pnpm dev:proxy` (no libera puertos; si da EADDRINUSE, usar `pnpm dev:levantar`).

- 502: origin al puerto correcto y proceso arriba. 500: logs y env.
- Comprobar: `node scripts/ejecutar-pruebas-reales-todas.mjs`

---

## Si app-test.bodasdehoy.com no carga (y chat-test sí)

1. **Misma máquina para túnel y apps**  
   El túnel (`./scripts/iniciar-tunnel.sh`) debe correr **en la misma máquina** donde ejecutas `pnpm dev:levantar` o `pnpm dev`. El config del repo (`config/cloudflared-config.yml`) envía app-test → `http://127.0.0.1:8080` y chat-test → `http://127.0.0.1:3210`.

2. **Usar el config del repo**  
   Arranca el túnel desde la raíz del repo para que use `config/cloudflared-config.yml` (puerto 8080 para app-test):
   ```bash
   ./scripts/iniciar-tunnel.sh
   ```
   Si arrancas con `cloudflared tunnel run lobe-chat-harbor` sin `--config`, se usará `~/.cloudflared/config.yml`; debe coincidir app-test → 8080 y chat-test → 3210.

3. **Comprobar que la app responde en 8080**  
   En la máquina donde corre `pnpm dev` o `pnpm dev:levantar`:
   ```bash
   curl -s http://127.0.0.1:8080/api/health
   ```
   Debe devolver respuesta OK. Si no responde, reinicia con `pnpm dev:levantar` o `pnpm dev`.

4. **Chat-test y app-test en la misma VPN**  
   Si ambos dominios están en la misma VPN pero el túnel corre en **otra** máquina (p. ej. un servidor) y las apps en tu portátil, en esa otra máquina el túnel no puede usar `localhost:8080`. En ese caso hay que apuntar al puerto 8080 de la IP de tu portátil en la VPN (p. ej. en `config/cloudflared-config.yml` temporalmente `service: http://10.x.x.x:8080`). La app escucha en 127.0.0.1:8080 por defecto; para acceso por red usa `pnpm dev:web:local` (0.0.0.0:8080).
