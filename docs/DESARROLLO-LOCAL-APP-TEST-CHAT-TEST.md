# Desarrollo local: que app-test y chat-test carguen en esta máquina (Charles)

**Contexto:** Estamos en **desarrollo** en esta máquina. El reverse (túnel/proxy) apunta al puerto donde corre la app. Necesitamos que **app-test** y **chat-test** carguen **aquí** porque Firebase no acepta `localhost` para el login (registro/sesión).

Esto es **solo para desarrollo en este equipo**. No es configuración de producción.

---

## 1. Por qué hacen falta estos dominios en local

- **Login (Firebase):** Firebase Auth solo permite dominios autorizados. Si usas `localhost`, no puedes hacer login. Por eso usamos `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` también en esta máquina.
- **Reverse:** El reverse (túnel cloudflared o proxy local) en esta máquina ya está configurado para enviar tráfico a los puertos donde corre la web (8080) y el Copilot (3210).

---

## 2. Qué hace falta en esta máquina (solo desarrollo)

### A) /etc/hosts (obligatorio)

Sin esto, `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` no resuelven a tu máquina y no cargan.

```bash
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

Comprobar:

```bash
grep -E "app-test|chat-test" /etc/hosts
```

### B) Reverse apuntando a los puertos de esta máquina

- **app-test.bodasdehoy.com** → `http://localhost:8080` (web)
- **chat-test.bodasdehoy.com** → `http://localhost:3210` (Copilot)

Si usas el túnel cloudflared con `config/cloudflared-config.yml`, ya está definido así. Solo hay que tener el túnel corriendo (`./scripts/iniciar-tunnel.sh`) y que en Cloudflare los Public Hostnames de app-test y chat-test apunten a este túnel.  
Si en cambio usas un proxy **solo local** (p. ej. Caddy/nginx en esta máquina), ese proxy debe tener dos virtual hosts: uno para app-test → :8080 y otro para chat-test → :3210.

### C) Servicios levantados en esta máquina

- **Web (app-test):** `cd apps/web && npm run dev` o `npm run dev:local` → puerto **8080**
- **Copilot (chat-test):** `cd apps/copilot && pnpm dev` → puerto **3210**

---

## 3. Cómo abrir en el navegador (desarrollo)

- **Con reverse y sin puerto en la URL:**  
  `https://app-test.bodasdehoy.com` y `https://chat-test.bodasdehoy.com` (el reverse recibe en 443 y reenvía a 8080/3210).

- **Sin reverse / solo /etc/hosts:**  
  `http://app-test.bodasdehoy.com:8080` y `http://chat-test.bodasdehoy.com:3210`.

En ambos casos, **/etc/hosts** debe tener las dos líneas anteriores para que los nombres resuelvan a 127.0.0.1 en esta máquina.

---

## 4. Verificación rápida

Desde la raíz del repo:

```bash
./scripts/verificar-subdominios.sh
```

Comprueba: /etc/hosts, que 8080 y 3210 respondan, y que las URLs por subdominio (con puerto) respondan.

---

## Resumen

| Qué | Dónde | Desarrollo (esta máquina) |
|-----|--------|----------------------------|
| Nombres de dominio | /etc/hosts | `127.0.0.1 app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` |
| Reverse | Esta máquina | app-test → :8080, chat-test → :3210 |
| Servicios | Esta máquina | Web en 8080, Copilot en 3210 |

Si app-test y chat-test no cargan en esta máquina, revisar por orden: (1) /etc/hosts, (2) que web y Copilot estén en 8080 y 3210, (3) que el reverse en esta máquina envíe app-test y chat-test a esos puertos.
