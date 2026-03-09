# chat-test no carga: revisar (app-test ya sí carga)

**Situación:** app-test ya carga; **chat-test no**. Revisar si el **puerto 3210** está en uso y si el tráfico a chat-test llega a ese puerto.

---

## 1. Puerto 3210: ¿está escuchando?

chat-test = **Copilot** (LobeChat). Siempre usa el puerto **3210** (dev y prod).

### En tu máquina local

```bash
# ¿Algo escucha en 3210?
lsof -i :3210
# o
netstat -an | grep 3210
```

Si **no hay nada** en 3210:

- **Desarrollo:** levantar el Copilot:
  ```bash
  cd apps/copilot
  pnpm dev
  ```
  (Escucha en `0.0.0.0:3210`.)

- **Producción:** levantar con start.sh o PM2:
  ```bash
  cd apps/copilot && ./start.sh
  # o con PM2: pm2 start apps/copilot/start.sh --name chat-test
  ```

Comprobar que responde en local:

```bash
curl -I http://127.0.0.1:3210
```

Debe devolver **200** (o 304). Si no, el Copilot no está arriba o no está en 3210.

---

## 2. Derivación: ¿chat-test llega al puerto 3210?

Aunque app-test cargue, **chat-test** puede no estar configurado en el reverse proxy o en el Tunnel. Hay que asegurar que **chat-test.bodasdehoy.com** se envíe a **http://localhost:3210** (o a la IP:3210 del servidor).

### Si usas Cloudflare Tunnel (cloudflared) en la máquina local

Revisar `~/.cloudflared/config.yml` (o el config que use el tunnel). Debe haber una regla de **ingress** para chat-test:

```yaml
ingress:
  - hostname: app-test.bodasdehoy.com
    service: http://localhost:3000   # (o 8080 en dev)
  - hostname: chat-test.bodasdehoy.com
    service: http://localhost:3210    # ← obligatorio para chat-test
  - service: http_status:404
```

Si **falta** la entrada de `chat-test.bodasdehoy.com` → `http://localhost:3210`, añadirla, guardar y reiniciar el tunnel:

```bash
# Reiniciar cloudflared (o el proceso que use el config)
cloudflared tunnel run <nombre-del-tunnel>
```

### Si usas Nginx (o Caddy) como reverse proxy local

Debe existir un **server** (virtual host) para `chat-test.bodasdehoy.com` con proxy al 3210:

**Nginx (ejemplo):**

```nginx
server {
    server_name chat-test.bodasdehoy.com;
    location / {
        proxy_pass http://127.0.0.1:3210;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Tras cambiar la config, recargar nginx: `sudo nginx -s reload` (o el comando que uses).

---

## 3. Checklist rápido: chat-test no carga

| Paso | Comprobación | Si falla |
|------|--------------|----------|
| 1 | En la máquina donde debe correr Copilot: `lsof -i :3210` o `curl -I http://127.0.0.1:3210` | Levantar Copilot: `cd apps/copilot && pnpm dev` o `./start.sh` |
| 2 | Tunnel o proxy: existe regla **chat-test.bodasdehoy.com** → **http://localhost:3210** | Añadir hostname chat-test en ingress (cloudflared) o server (nginx) y reiniciar/recargar |
| 3 | Desde fuera: `curl -I https://chat-test.bodasdehoy.com` | Debe devolver 200; si 502, el origen (3210) no responde o no está bien enrutado |

---

## 4. Resumen

- **chat-test** = Copilot en puerto **3210**.
- **App-test ya carga** → el problema es solo **chat-test**.
- Revisar: (1) **¿Hay algo escuchando en 3210?** Si no, levantar `apps/copilot` (pnpm dev o start.sh). (2) **¿El reverse proxy / Tunnel envía chat-test a 3210?** Si no, añadir la regla para `chat-test.bodasdehoy.com` → `http://localhost:3210`.
